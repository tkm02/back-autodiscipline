const cron = require("node-cron")
const { PrismaClient } = require("@prisma/client")
const logger = require("./logger")

const prisma = new PrismaClient()

// Fonction pour mettre à jour les progressions manquantes
const updateMissingProgressions = async () => {
  try {
    logger.info("Exécution de la tâche cron: mise à jour des progressions manquantes")

    const objectifs = await prisma.objectif.findMany({
      where: {
        statut: "en_cours",
        typeDeTracking: "binaire",
      },
    })

    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]

    let updatedCount = 0

    await Promise.all(
      objectifs.map(async (obj) => {
        let updated = false
        const progression = { ...obj.progression }

        // Vérifier si la progression d'hier existe
        if (progression[yesterday] === undefined) {
          progression[yesterday] = false
          updated = true
        }

        if (updated) {
          await prisma.objectif.update({
            where: { id: obj.id },
            data: { progression },
          })

          updatedCount++
        }

        return obj
      }),
    )

    logger.info(`Tâche cron terminée: ${updatedCount} objectifs mis à jour`)
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour des progressions manquantes: ${error.message}`)
  }
}

// Initialiser les tâches cron
const initCronJobs = () => {
  // Exécuter tous les jours à minuit
  cron.schedule("0 0 * * *", updateMissingProgressions)

  logger.info("Tâches cron initialisées")
}

module.exports = { initCronJobs }
