const app = require("./app")
const config = require("./config/config")
const connectDB = require("./config/database")

// Connexion à la base de données
connectDB()

// Démarrage du serveur
const PORT = config.port || 5000
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT} en mode ${config.nodeEnv}`)
})

