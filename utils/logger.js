const winston = require("winston")
const path = require("path")

// Définir les niveaux de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Définir les couleurs pour chaque niveau
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
}

// Ajouter les couleurs à winston
winston.addColors(colors)

// Définir le format de log
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
)

// Définir les transports (où les logs seront stockés)
const transports = [
  // Afficher les logs dans la console
  new winston.transports.Console(),

  // Écrire les logs d'erreur dans un fichier
  new winston.transports.File({
    filename: path.join("logs", "error.log"),
    level: "error",
  }),

  // Écrire tous les logs dans un autre fichier
  new winston.transports.File({
    filename: path.join("logs", "all.log"),
  }),
]

// Créer l'instance de logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  levels,
  format,
  transports,
})

module.exports = logger
