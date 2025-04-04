const { PrismaClient } = require("@prisma/client")
const asyncHandler = require("../utils/asyncHandler")

const prisma = new PrismaClient()

// @desc    Récupérer tous les objectifs
// @route   GET /api/objectifs
// @access  Privé
exports.getObjectifs = asyncHandler(async (req, res) => {
  const objectifs = await prisma.objectif.findMany({
    where: {
      utilisateurId: req.utilisateur.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  res.status(200).json({
    success: true,
    count: objectifs.length,
    data: objectifs,
  })
})

// @desc    Récupérer un objectif par ID
// @route   GET /api/objectifs/:id
// @access  Privé
exports.getObjectif = asyncHandler(async (req, res) => {
  const objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cet objectif",
    })
  }

  res.status(200).json({
    success: true,
    data: objectif,
  })
})

// @desc    Créer un nouvel objectif
// @route   POST /api/objectifs
// @access  Privé
exports.createObjectif = asyncHandler(async (req, res) => {
  // Ajouter l'ID de l'utilisateur à l'objectif
  req.body.utilisateurId = req.utilisateur.id

  // Créer l'objectif
  const objectif = await prisma.objectif.create({
    data: {
      nom: req.body.nom,
      categorie: req.body.categorie,
      typeDeTracking: req.body.typeDeTracking,
      frequence: req.body.frequence,
      cible: req.body.cible || null,
      description: req.body.description || null,
      progression: req.body.progression || {},
      utilisateurId: req.body.utilisateurId,
    },
  })

  res.status(201).json({
    success: true,
    data: objectif,
  })
})

// @desc    Mettre à jour un objectif
// @route   PUT /api/objectifs/:id
// @access  Privé
exports.updateObjectif = asyncHandler(async (req, res) => {
  let objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à modifier cet objectif",
    })
  }

  // Mettre à jour l'objectif
  objectif = await prisma.objectif.update({
    where: {
      id: req.params.id,
    },
    data: {
      nom: req.body.nom || objectif.nom,
      categorie: req.body.categorie || objectif.categorie,
      typeDeTracking: req.body.typeDeTracking || objectif.typeDeTracking,
      frequence: req.body.frequence || objectif.frequence,
      cible: req.body.cible !== undefined ? req.body.cible : objectif.cible,
      description: req.body.description !== undefined ? req.body.description : objectif.description,
      progression: req.body.progression || objectif.progression,
    },
  })

  res.status(200).json({
    success: true,
    data: objectif,
  })
})

// @desc    Mettre à jour la progression d'un objectif
// @route   PATCH /api/objectifs/:id/progression
// @access  Privé
exports.updateProgression = asyncHandler(async (req, res) => {
  const { date, valeur } = req.body

  if (!date || valeur === undefined) {
    return res.status(400).json({
      success: false,
      error: "Veuillez fournir une date et une valeur",
    })
  }

  let objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à modifier cet objectif",
    })
  }

  // Mettre à jour la progression
  const progression = { ...objectif.progression }
  progression[date] = valeur

  objectif = await prisma.objectif.update({
    where: {
      id: req.params.id,
    },
    data: {
      progression,
    },
  })

  res.status(200).json({
    success: true,
    data: objectif,
  })
})

// @desc    Supprimer un objectif
// @route   DELETE /api/objectifs/:id
// @access  Privé
exports.deleteObjectif = asyncHandler(async (req, res) => {
  const objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à supprimer cet objectif",
    })
  }

  await prisma.objectif.delete({
    where: {
      id: req.params.id,
    },
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})

