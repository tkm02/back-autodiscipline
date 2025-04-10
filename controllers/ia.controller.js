import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import asyncHandler from "../utils/asyncHandler.js";

const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize DeepSeek client
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// Fallback response when APIs are unavailable
const getFallbackResponse = (context) => {
  return `Je suis désolé, mais je rencontre actuellement des difficultés techniques pour accéder aux services d'IA. Voici quelques suggestions générales basées sur votre demande :

1. Prenez le temps de réfléchir à votre objectif et de le décomposer en petites étapes réalisables.
2. Fixez-vous des échéances réalistes pour chaque étape.
3. Suivez régulièrement vos progrès et ajustez votre approche si nécessaire.
4. N'hésitez pas à demander de l'aide ou des conseils à des personnes expérimentées dans votre domaine.

Je vous invite à réessayer votre demande dans quelques instants.`;
};

// Helper function to call DeepSeek API
async function callDeepSeekAPI(messages) {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw error;
  }
}

// Helper function to get AI response with fallback
async function getAIResponse(messages, context = {}) {
  try {
    // Try OpenAI first
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages
    });
    return completion.choices[0].message.content;
  } catch (openaiError) {
    console.warn("OpenAI API failed, falling back to DeepSeek:", openaiError);
    try {
      // Fallback to DeepSeek
      return await callDeepSeekAPI(messages);
    } catch (deepseekError) {
      console.error("Both APIs failed:", deepseekError);
      // Return fallback response instead of throwing error
      return getFallbackResponse(context);
    }
  }
}

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      utilisateurId: req.utilisateur.id,
    },
    include: {
      objectif: {
        select: {
          id: true,
          nom: true,
          categorie: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations,
  });
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      objectif: {
        select: {
          id: true,
          nom: true,
          categorie: true,
          description: true,
        },
      },
    },
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: "Conversation non trouvée",
    });
  }

  if (conversation.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cette conversation",
    });
  }

  res.status(200).json({
    success: true,
    data: conversation,
  });
});

export const createConversation = asyncHandler(async (req, res) => {
  const { objectifId } = req.body;

  if (objectifId) {
    const objectif = await prisma.objectif.findUnique({
      where: {
        id: objectifId,
      },
    });

    if (!objectif) {
      return res.status(404).json({
        success: false,
        error: "Objectif non trouvé",
      });
    }

    if (objectif.utilisateurId !== req.utilisateur.id) {
      return res.status(401).json({
        success: false,
        error: "Non autorisé à accéder à cet objectif",
      });
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      objectifId: objectifId || null,
      utilisateurId: req.utilisateur.id,
      messages: [],
    },
  });

  res.status(201).json({
    success: true,
    data: conversation,
  });
});

export const addMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "Veuillez fournir un message",
    });
  }

  let conversation = await prisma.conversation.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      objectif: true,
    },
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: "Conversation non trouvée",
    });
  }

  if (conversation.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cette conversation",
    });
  }

  const messages = [...conversation.messages, { role: "user", content: message }];

  let systemMessage = "Tu es un assistant intelligent qui aide les utilisateurs à atteindre leurs objectifs.";

  if (conversation.objectif) {
    systemMessage += ` L'utilisateur travaille sur un objectif de type ${conversation.objectif.categorie}: "${conversation.objectif.nom}".`;

    if (conversation.objectif.description) {
      systemMessage += ` Description: ${conversation.objectif.description}.`;
    }

    if (conversation.objectif.categorie === "spirituel") {
      systemMessage +=
        " Donne des conseils spirituels islamiques, des versets du Coran et des hadiths pertinents. Encourage la pratique religieuse et la connexion spirituelle.";
    } else if (conversation.objectif.categorie === "professionnel") {
      systemMessage +=
        " Donne des conseils professionnels, des stratégies de développement de carrière et des ressources pour améliorer les compétences professionnelles.";
    } else if (conversation.objectif.categorie === "personnel") {
      systemMessage +=
        " Donne des conseils de développement personnel, des habitudes à adopter et des stratégies pour atteindre les objectifs personnels.";
    } else if (conversation.objectif.categorie === "finance") {
      systemMessage +=
        " Donne des conseils financiers, des stratégies d'épargne et d'investissement, et des astuces pour gérer son budget.";
    }
  }

  const openaiMessages = [
    { role: "system", content: systemMessage },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const iaResponse = await getAIResponse(openaiMessages, { 
      objectif: conversation.objectif,
      messageHistory: messages 
    });

    messages.push({ role: "assistant", content: iaResponse });

    conversation = await prisma.conversation.update({
      where: {
        id: req.params.id,
      },
      data: {
        messages,
      },
    });

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error getting AI response:", error);

    res.status(500).json({
      success: false,
      error: "Erreur lors de la génération de la réponse de l'IA",
    });
  }
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: "Conversation non trouvée",
    });
  }

  if (conversation.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à supprimer cette conversation",
    });
  }

  await prisma.conversation.delete({
    where: {
      id: req.params.id,
    },
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

export const getSuggestions = asyncHandler(async (req, res) => {
  const { objectifId } = req.params;

  const objectif = await prisma.objectif.findUnique({
    where: {
      id: objectifId,
    },
  });

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    });
  }

  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cet objectif",
    });
  }

  let prompt = `Génère 3 suggestions concrètes pour aider à atteindre l'objectif suivant:
  
  Nom de l'objectif: ${objectif.nom}
  Catégorie: ${objectif.categorie}
  Type de suivi: ${objectif.typeDeTracking}
  Fréquence: ${objectif.frequence}
  `;

  if (objectif.description) {
    prompt += `Description: ${objectif.description}\n`;
  }

  if (objectif.cible) {
    prompt += `Cible: ${objectif.cible}\n`;
  }

  prompt += `
  Pour chaque suggestion, inclus:
  1. Un titre court
  2. Une description détaillée
  3. Des étapes concrètes à suivre
  4. Des ressources recommandées (livres, sites web, applications, etc.)
  
  Formate les suggestions de manière claire et structurée. Assure-toi qu'elles sont pertinentes pour la catégorie de l'objectif.`;

  try {
    const suggestions = await getAIResponse([
      { role: "system", content: "Tu es un assistant expert en coaching et développement personnel." },
      { role: "user", content: prompt }
    ], { objectif });

    res.status(200).json({
      success: true,
      data: {
        suggestions,
      },
    });
  } catch (error) {
    console.error("Error getting AI suggestions:", error);

    res.status(500).json({
      success: false,
      error: "Erreur lors de la génération des suggestions",
    });
  }
});

export const getActualites = asyncHandler(async (req, res) => {
  const { objectifId } = req.params;

  const objectif = await prisma.objectif.findUnique({
    where: {
      id: objectifId,
    },
  });

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    });
  }

  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cet objectif",
    });
  }

  const actualites = [
    {
      id: "1",
      titre: `Nouvelles tendances en ${objectif.categorie}`,
      description: `Découvrez les dernières tendances dans le domaine ${objectif.categorie} qui pourraient vous aider à atteindre votre objectif "${objectif.nom}".`,
      url: "https://example.com/article1",
      date: new Date().toISOString(),
      source: "Example News",
    },
    {
      id: "2",
      titre: `Comment améliorer votre ${objectif.nom}`,
      description: `Des experts partagent leurs conseils pour améliorer votre ${objectif.nom} et atteindre vos objectifs plus rapidement.`,
      url: "https://example.com/article2",
      date: new Date(Date.now() - 86400000).toISOString(),
      source: "Expert Advice",
    },
    {
      id: "3",
      titre: `Étude récente sur ${objectif.categorie}`,
      description: `Une nouvelle étude révèle des informations intéressantes sur ${objectif.categorie} qui pourraient influencer votre approche de "${objectif.nom}".`,
      url: "https://example.com/article3",
      date: new Date(Date.now() - 172800000).toISOString(),
      source: "Research Journal",
    },
  ];

  res.status(200).json({
    success: true,
    count: actualites.length,
    data: actualites,
  });
});

export default getAIResponse;  