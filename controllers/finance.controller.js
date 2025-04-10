const { PrismaClient } = require("@prisma/client")
const asyncHandler = require("../utils/asyncHandler")

const prisma = new PrismaClient()

// @desc    Récupérer toutes les finances
// @route   GET /api/finances
// @access  Privé
exports.getFinances = asyncHandler(async (req, res) => {
  const finances = await prisma.finance.findMany({
    where: {
      utilisateurId: req.utilisateur.id,
    },
    orderBy: {
      date: "desc",
    },
  })

  res.status(200).json({
    success: true,
    count: finances.length,
    data: finances,
  })
})

// @desc    Récupérer une finance par ID
// @route   GET /api/finances/:id
// @access  Privé
exports.getFinance = asyncHandler(async (req, res) => {
  const finance = await prisma.finance.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!finance) {
    return res.status(404).json({
      success: false,
      error: "Finance non trouvée",
    })
  }

  // Vérifier que la finance appartient à l'utilisateur
  if (finance.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cette finance",
    })
  }

  res.status(200).json({
    success: true,
    data: finance,
  })
})

// @desc    Créer une nouvelle finance
// @route   POST /api/finances
// @access  Privé
exports.createFinance = asyncHandler(async (req, res) => {
  // Ajouter l'ID de l'utilisateur à la finance
  req.body.utilisateurId = req.utilisateur.id

  // Créer la finance
  const finance = await prisma.finance.create({
    data: {
      nom: req.body.nom,
      type: req.body.type,
      montant: req.body.montant,
      devise: req.body.devise || "FCFA",
      date: new Date(req.body.date),
      categorie: req.body.categorie,
      description: req.body.description,
      recurrent: req.body.recurrent || false,
      frequence: req.body.frequence,
      utilisateurId: req.body.utilisateurId,
    },
  })

  res.status(201).json({
    success: true,
    data: finance,
  })
})

// @desc    Mettre à jour une finance
// @route   PUT /api/finances/:id
// @access  Privé
exports.updateFinance = asyncHandler(async (req, res) => {
  let finance = await prisma.finance.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!finance) {
    return res.status(404).json({
      success: false,
      error: "Finance non trouvée",
    })
  }

  // Vérifier que la finance appartient à l'utilisateur
  if (finance.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à modifier cette finance",
    })
  }

  // Mettre à jour la finance
  finance = await prisma.finance.update({
    where: {
      id: req.params.id,
    },
    data: {
      nom: req.body.nom || finance.nom,
      type: req.body.type || finance.type,
      montant: req.body.montant !== undefined ? req.body.montant : finance.montant,
      devise: req.body.devise || finance.devise,
      date: req.body.date ? new Date(req.body.date) : finance.date,
      categorie: req.body.categorie !== undefined ? req.body.categorie : finance.categorie,
      description: req.body.description !== undefined ? req.body.description : finance.description,
      recurrent: req.body.recurrent !== undefined ? req.body.recurrent : finance.recurrent,
      frequence: req.body.frequence !== undefined ? req.body.frequence : finance.frequence,
    },
  })

  res.status(200).json({
    success: true,
    data: finance,
  })
})

// @desc    Supprimer une finance
// @route   DELETE /api/finances/:id
// @access  Privé
exports.deleteFinance = asyncHandler(async (req, res) => {
  const finance = await prisma.finance.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!finance) {
    return res.status(404).json({
      success: false,
      error: "Finance non trouvée",
    })
  }

  // Vérifier que la finance appartient à l'utilisateur
  if (finance.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à supprimer cette finance",
    })
  }

  await prisma.finance.delete({
    where: {
      id: req.params.id,
    },
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Récupérer les statistiques financières
// @route   GET /api/finances/stats
// @access  Privé
exports.getFinanceStats = asyncHandler(async (req, res) => {
  const utilisateurId = req.utilisateur.id;
  
  // Obtenir le mois en cours
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Revenus du mois
  const revenus = await prisma.finance.aggregate({
    where: {
      utilisateurId,
      type: "revenu",
      date: {
        gte: debutMois,
        lte: finMois,
      },
    },
    _sum: {
      montant: true,
    },
  });
  
  // Dépenses du mois
  const depenses = await prisma.finance.aggregate({
    where: {
      utilisateurId,
      type: "depense",
      date: {
        gte: debutMois,
        lte: finMois,
      },
    },
    _sum: {
      montant: true,
    },
  });
  
  // Épargne du mois
  const epargne = await prisma.finance.aggregate({
    where: {
      utilisateurId,
      type: "epargne",
      date: {
        gte: debutMois,
        lte: finMois,
      },
    },
    _sum: {
      montant: true,
    },
  });
  
  // Investissements du mois
  const investissements = await prisma.finance.aggregate({
    where: {
      utilisateurId,
      type: "investissement",
      date: {
        gte: debutMois,
        lte: finMois,
      },
    },
    _sum: {
      montant: true,
    },
  });
  
  // Répartition des dépenses par catégorie
  const depensesParCategorie = await prisma.finance.groupBy({
    by: ["categorie"],
    where: {
      utilisateurId,
      type: "depense",
      date: {
        gte: debutMois,
        lte: finMois,
      },
    },
    _sum: {
      montant: true,
    },
  });
  
  // Évolution des finances sur les 6 derniers mois
  const evolution = [];
  for (let i = 5; i >= 0; i--) {
    const moisDebut = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const moisFin = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const revenusMois = await prisma.finance.aggregate({
      where: {
        utilisateurId,
        type: "revenu",
        date: {
          gte: moisDebut,
          lte: moisFin,
        },
      },
      _sum: {
        montant: true,
      },
    });
    
    const depensesMois = await prisma.finance.aggregate({
      where: {
        utilisateurId,
        type: "depense",
        date: {
          gte: moisDebut,
          lte: moisFin,
        },
      },
      _sum: {
        montant: true,
      },
    });
    
    evolution.push({
      mois: `${moisDebut.getMonth() + 1}/${moisDebut.getFullYear()}`,
      revenus: revenusMois._sum.montant || 0,
      depenses: depensesMois._sum.montant || 0,
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      revenus: revenus._sum.montant || 0,
      depenses: depenses._sum.montant || 0,
      epargne: epargne._sum.montant || 0,
      investissements: investissements._sum.montant || 0,
      depensesParCategorie: depensesParCategorie.map(cat => ({
        categorie: cat.categorie || "Non catégorisé",
        montant: cat._sum.montant,
      })),
      evolution,
    },
  });
})

// @desc    Récupérer les paramètres de l'utilisateur
// @route   GET /api/finances/parametres
// @access  Privé
exports.getParametres = asyncHandler(async (req, res) => {
  let parametres = await prisma.parametres.findUnique({
    where: {
      utilisateurId: req.utilisateur.id,
    },
  });

  if (!parametres) {
    // Créer des paramètres par défaut si non existants
    parametres = await prisma.parametres.create({
      data: {
        deviseParDefaut: "FCFA",
        theme: "light",
        utilisateurId: req.utilisateur.id,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: parametres,
  });
});

// @desc    Mettre à jour les paramètres de l'utilisateur
// @route   PUT /api/finances/parametres
// @access  Privé
exports.updateParametres = asyncHandler(async (req, res) => {
  let parametres = await prisma.parametres.findUnique({
    where: {
      utilisateurId: req.utilisateur.id,
    },
  });

  if (!parametres) {
    // Créer des paramètres par défaut si non existants
    parametres = await prisma.parametres.create({
      data: {
        deviseParDefaut: req.body.deviseParDefaut || "FCFA",
        theme: req.body.theme || "light",
        utilisateurId: req.utilisateur.id,
      },
    });
  } else {
    // Mettre à jour les paramètres existants
    parametres = await prisma.parametres.update({
      where: {
        utilisateurId: req.utilisateur.id,
      },
      data: {
        deviseParDefaut: req.body.deviseParDefaut || parametres.deviseParDefaut,
        theme: req.body.theme || parametres.theme,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: parametres,
  });
});
