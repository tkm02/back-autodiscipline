const { PrismaClient } = require("@prisma/client")
const asyncHandler = require("../utils/asyncHandler")

const prisma = new PrismaClient()

// @desc    Récupérer toutes les ressources d'un objectif
// @route   GET /api/objectifs/:objectifId/ressources
// @access  Privé
exports.getRessources = asyncHandler(async (req, res) => {
  const { objectifId } = req.params

  // Vérifier que l'objectif existe et appartient à l'utilisateur
  const objectif = await prisma.objectif.findUnique({
    where: {
      id: objectifId,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cet objectif",
    })
  }

  const ressources = await prisma.ressource.findMany({
    where: {
      objectifId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  res.status(200).json({
    success: true,
    count: ressources.length,
    data: ressources,
  })
})

// @desc    Récupérer une ressource par ID
// @route   GET /api/ressources/:id
// @access  Privé
exports.getRessource = asyncHandler(async (req, res) => {
  const ressource = await prisma.ressource.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      objectif: true,
    },
  })

  if (!ressource) {
    return res.status(404).json({
      success: false,
      error: "Ressource non trouvée",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (ressource.objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cette ressource",
    })
  }

  res.status(200).json({
    success: true,
    data: ressource,
  })
})

// @desc    Créer une nouvelle ressource
// @route   POST /api/objectifs/:objectifId/ressources
// @access  Privé
exports.createRessource = asyncHandler(async (req, res) => {
  const { objectifId } = req.params

  // Vérifier que l'objectif existe et appartient à l'utilisateur
  const objectif = await prisma.objectif.findUnique({
    where: {
      id: objectifId,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à modifier cet objectif",
    })
  }

  // Créer la ressource
  const ressource = await prisma.ressource.create({
    data: {
      titre: req.body.titre,
      type: req.body.type,
      url: req.body.url,
      description: req.body.description,
      objectifId,
    },
  })

  res.status(201).json({
    success: true,
    data: ressource,
  })
})

// @desc    Mettre à jour une ressource
// @route   PUT /api/ressources/:id
// @access  Privé
exports.updateRessource = asyncHandler(async (req, res) => {
  let ressource = await prisma.ressource.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      objectif: true,
    },
  })

  if (!ressource) {
    return res.status(404).json({
      success: false,
      error: "Ressource non trouvée",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (ressource.objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à modifier cette ressource",
    })
  }

  // Mettre à jour la ressource
  ressource = await prisma.ressource.update({
    where: {
      id: req.params.id,
    },
    data: {
      titre: req.body.titre || ressource.titre,
      type: req.body.type || ressource.type,
      url: req.body.url || ressource.url,
      description: req.body.description !== undefined ? req.body.description : ressource.description,
    },
  })

  res.status(200).json({
    success: true,
    data: ressource,
  })
})

// @desc    Supprimer une ressource
// @route   DELETE /api/ressources/:id
// @access  Privé
exports.deleteRessource = asyncHandler(async (req, res) => {
  const ressource = await prisma.ressource.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      objectif: true,
    },
  })

  if (!ressource) {
    return res.status(404).json({
      success: false,
      error: "Ressource non trouvée",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (ressource.objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à supprimer cette ressource",
    })
  }

  await prisma.ressource.delete({
    where: {
      id: req.params.id,
    },
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})

