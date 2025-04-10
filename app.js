const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const path = require("path")
const config = require("./config/config")
const errorHandler = require("./middleware/errorHandler")
const { initCronJobs } = require("./utils/cronJobs")
const logger = require("./utils/logger")

// Routes
const authRoutes = require("./routes/auth.routes")
const objectifRoutes = require("./routes/objectif.routes")
const exportRoutes = require("./routes/export.routes")
const financeRoutes = require("./routes/finance.routes")
const iaRoutes = require("./routes/ia.routes")
const coranRoutes = require("./routes/coran.routes")
const cultureRoutes = require("./routes/culture.routes")
const ressourcesRoutes = require("./routes/ressource.routes")
const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging en développement
if (config.nodeEnv === "development") {
  app.use(morgan("dev"))
}

// Dossier statique pour les fichiers publics
app.use(express.static(path.join(__dirname, "public")))

// Routes API
app.use("/api/auth", authRoutes)
app.use("/api/objectifs", objectifRoutes)
app.use("/api/export", exportRoutes)
app.use("/api/finances", financeRoutes)
app.use("/api/ia", iaRoutes)
app.use("/api/coran", coranRoutes)
app.use("/api/culture", cultureRoutes)
app.use("/api/ressources", ressourcesRoutes)

// Route de base
app.get("/", (req, res) => {
  res.json({ message: "API de Suivi d'Objectifs" })
})

// Middleware de gestion des erreurs
app.use(errorHandler)

// Initialiser les tâches cron
initCronJobs()
logger.info("Tâches cron initialisées") 

module.exports = app
