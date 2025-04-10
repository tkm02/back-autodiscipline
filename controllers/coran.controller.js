const { PrismaClient } = require("@prisma/client")
const asyncHandler = require("../utils/asyncHandler")

const prisma = new PrismaClient()

// @desc    Récupérer les sourates du Coran
// @route   GET /api/coran/sourates
// @access  Public
exports.getSourates = asyncHandler(async (req, res) => {
  // Liste des sourates du Coran
  const sourates = [
    { numero: 1, nom: "Al-Fatiha", nomArabe: "الفاتحة", nombreVersets: 7 },
    { numero: 2, nom: "Al-Baqara", nomArabe: "البقرة", nombreVersets: 286 },
    // ... autres sourates
  ]

  res.status(200).json({
    success: true,
    count: sourates.length,
    data: sourates,
  })
})

// @desc    Récupérer les versets d'une sourate
// @route   GET /api/coran/sourates/:sourate
// @access  Public
exports.getVersets = asyncHandler(async (req, res) => {
  const { sourate } = req.params
  const numeroSourate = Number.parseInt(sourate)

  if (isNaN(numeroSourate) || numeroSourate < 1 || numeroSourate > 114) {
    return res.status(400).json({
      success: false,
      error: "Numéro de sourate invalide",
    })
  }

  const versets = await prisma.versetCoran.findMany({
    where: {
      sourate: numeroSourate,
    },
    orderBy: {
      verset: "asc",
    },
  })

  res.status(200).json({
    success: true,
    count: versets.length,
    data: versets,
  })
})

// @desc    Récupérer un verset spécifique
// @route   GET /api/coran/sourates/:sourate/versets/:verset
// @access  Public
exports.getVerset = asyncHandler(async (req, res) => {
  const { sourate, verset } = req.params
  const numeroSourate = Number.parseInt(sourate)
  const numeroVerset = Number.parseInt(verset)

  if (isNaN(numeroSourate) || numeroSourate < 1 || numeroSourate > 114) {
    return res.status(400).json({
      success: false,
      error: "Numéro de sourate invalide",
    })
  }

  if (isNaN(numeroVerset) || numeroVerset < 1) {
    return res.status(400).json({
      success: false,
      error: "Numéro de verset invalide",
    })
  }

  const versetData = await prisma.versetCoran.findFirst({
    where: {
      sourate: numeroSourate,
      verset: numeroVerset,
    },
  })

  if (!versetData) {
    return res.status(404).json({
      success: false,
      error: "Verset non trouvé",
    })
  }

  res.status(200).json({
    success: true,
    data: versetData,
  })
})

// @desc    Rechercher dans le Coran
// @route   GET /api/coran/recherche
// @access  Public
exports.rechercherCoran = asyncHandler(async (req, res) => {
  const { q } = req.query

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Veuillez fournir un terme de recherche",
    })
  }

  const resultats = await prisma.versetCoran.findMany({
    where: {
      OR: [
        {
          texteArabe: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          texteFrancais: {
            contains: q,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: [
      {
        sourate: "asc",
      },
      {
        verset: "asc",
      },
    ],
  })

  res.status(200).json({
    success: true,
    count: resultats.length,
    data: resultats,
  })
})

 