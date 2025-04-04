const errorHandler = (err, req, res, next) => {
    console.error(err.stack)
  
    // Erreur Prisma
    if (err.code && err.code.startsWith("P")) {
      return res.status(400).json({
        success: false,
        error: "Erreur de base de données",
        details: err.message,
      })
    }
  
    // Erreur de validation
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message)
      return res.status(400).json({
        success: false,
        error: messages,
      })
    }
  
    // Erreur de JWT
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Token non valide",
      })
    }
  
    // Erreur d'expiration de JWT
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expiré",
      })
    }
  
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Erreur serveur",
    })
  }
  
  module.exports = errorHandler
  
  