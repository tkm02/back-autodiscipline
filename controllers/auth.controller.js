const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const config = require("../config/config")
const asyncHandler = require("../utils/asyncHandler")

const prisma = new PrismaClient()

// @desc    Inscrire un utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { nom, email, password } = req.body

  // Vérifier si l'utilisateur existe déjà
  const utilisateurExiste = await prisma.utilisateur.findUnique({
    where: { email },
  })

  if (utilisateurExiste) {
    return res.status(400).json({
      success: false,
      error: "Un utilisateur avec cet email existe déjà",
    })
  }

  // Hacher le mot de passe
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Créer l'utilisateur
  const utilisateur = await prisma.utilisateur.create({
    data: {
      nom,
      email,
      password: hashedPassword,
    },
  })

  // Générer le token JWT
  const token = generateToken(utilisateur.id)

  res.status(201).json({
    success: true,
    token,
    data: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
    },
  })
})

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Vérifier si l'utilisateur existe
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { email },
  })

  if (!utilisateur) {
    return res.status(401).json({
      success: false,
      error: "Identifiants invalides",
    })
  }

  // Vérifier le mot de passe
  const isMatch = await bcrypt.compare(password, utilisateur.password)

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: "Identifiants invalides",
    })
  }

  // Générer le token JWT
  const token = generateToken(utilisateur.id)

  res.status(200).json({
    success: true,
    token,
    data: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
    },
  })
})

// @desc    Obtenir l'utilisateur actuel
// @route   GET /api/auth/me
// @access  Privé
exports.getMe = asyncHandler(async (req, res) => {

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: req.utilisateur.id },
    select: {
      id: true,
      nom: true,
      email: true,
      createdAt: true,
    },
  })

  res.status(200).json({
    success: true,
    data: utilisateur,
  })
})

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  })
}

