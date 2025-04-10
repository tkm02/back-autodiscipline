const jwt = require("jsonwebtoken")
const { PrismaClient } = require("@prisma/client")
const config = require("../config/config")

const prisma = new PrismaClient()

// Middleware pour extraire le token JWT de l'URL (pour les téléchargements)
exports.tokenFromUrl = async (req, res, next) => {
  // Si l'utilisateur est déjà authentifié via le middleware auth, on continue
  if (req.utilisateur) {
    return next()
  }

  // Vérifier si un token est présent dans l'URL
  const token = req.query.token
    // console.log("Token from URL:", token)
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
      error: "Token non valide ou expiré",
    })
  }
}
