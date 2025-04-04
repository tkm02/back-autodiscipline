const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const config = require("./config/config");
const errorHandler = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/auth.routes");
const objectifRoutes = require("./routes/objectif.routes");
const exportRoutes = require("./routes/export.routes");

const app = express();

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

// Route de base
app.get("/", (req, res) => {
  res.json({ message: "API de Suivi d'Objectifs" })
})

// Middleware de gestion des erreurs
app.use(errorHandler)

module.exports = app
