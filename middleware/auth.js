const jwt = require("jsonwebtoken")
const { PrismaClient } = require("@prisma/client")
const config = require("../config/config")

const prisma = new PrismaClient()

exports.protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cette ressource",
    })
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, config.jwtSecret)

    // Récupérer l'utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: decoded.id },
    })

    if (!utilisateur) {
      return res.status(401).json({
        success: false,
        error: "Utilisateur non trouvé",
      })
    }

    req.utilisateur = utilisateur
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cette ressource",
    })
  }
}

