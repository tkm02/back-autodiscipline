const { PrismaClient } = require("@prisma/client")
const asyncHandler = require("../utils/asyncHandler")

const prisma = new PrismaClient()

// @desc    Récupérer tous les articles de culture islamique
// @route   GET /api/culture
// @access  Public
exports.getArticles = asyncHandler(async (req, res) => {
  const { categorie } = req.query

  const whereClause = categorie ? { categorie } : {}

  const articles = await prisma.articleCultureIslamique.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
  })

  res.status(200).json({
    success: true,
    count: articles.length,
    data: articles,
  })
})

// @desc    Récupérer un article par ID
// @route   GET /api/culture/:id
// @access  Public
exports.getArticle = asyncHandler(async (req, res) => {
  const article = await prisma.articleCultureIslamique.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!article) {
    return res.status(404).json({
      success: false,
      error: "Article non trouvé",
    })
  }

  res.status(200).json({
    success: true,
    data: article,
  })
})

// @desc    Créer un nouvel article (admin seulement)
// @route   POST /api/culture
// @access  Privé/Admin
exports.createArticle = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.utilisateur.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Non autorisé à créer des articles",
    })
  }

  const article = await prisma.articleCultureIslamique.create({
    data: {
      titre: req.body.titre,
      contenu: req.body.contenu,
      categorie: req.body.categorie,
      image: req.body.image,
    },
  })

  res.status(201).json({
    success: true,
    data: article,
  })
})

// @desc    Mettre à jour un article (admin seulement)
// @route   PUT /api/culture/:id
// @access  Privé/Admin
exports.updateArticle = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.utilisateur.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Non autorisé à modifier des articles",
    })
  }

  let article = await prisma.articleCultureIslamique.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!article) {
    return res.status(404).json({
      success: false,
      error: "Article non trouvé",
    })
  }

  article = await prisma.articleCultureIslamique.update({
    where: {
      id: req.params.id,
    },
    data: {
      titre: req.body.titre || article.titre,
      contenu: req.body.contenu || article.contenu,
      categorie: req.body.categorie || article.categorie,
      image: req.body.image !== undefined ? req.body.image : article.image,
    },
  })

  res.status(200).json({
    success: true,
    data: article,
  })
})

// @desc    Supprimer un article (admin seulement)
// @route   DELETE /api/culture/:id
// @access  Privé/Admin
exports.deleteArticle = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.utilisateur.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Non autorisé à supprimer des articles",
    })
  }

  const article = await prisma.articleCultureIslamique.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!article) {
    return res.status(404).json({
      success: false,
      error: "Article non trouvé",
    })
  }

  await prisma.articleCultureIslamique.delete({
    where: {
      id: req.params.id,
    },
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})

