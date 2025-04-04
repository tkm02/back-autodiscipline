const { PrismaClient } = require("@prisma/client")
const PDFDocument = require("pdfkit")
const ExcelJS = require("exceljs")
const fs = require("fs")
const path = require("path")
const asyncHandler = require("../utils/asyncHandler")
const { generatePdfTemplate } = require("../utils/pdfGenerator")
const { generateExcelReport } = require("../utils/excelGenerator")

const prisma = new PrismaClient()

// @desc    Exporter les objectifs en PDF
// @route   GET /api/export/pdf
// @access  Privé
exports.exportPdf = asyncHandler(async (req, res) => {
  // Récupérer les objectifs de l'utilisateur
  const objectifs = await prisma.objectif.findMany({
    where: {
      utilisateurId: req.utilisateur.id,
    },
    orderBy: {
      categorie: "asc",
    },
  })

  // Générer le PDF
  const pdfBuffer = await generatePdfReport(objectifs, req.utilisateur)

  // Définir les en-têtes de réponse
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", "attachment; filename=objectifs.pdf")

  // Envoyer le PDF
  res.send(pdfBuffer)
})

// @desc    Exporter les objectifs en Excel
// @route   GET /api/export/excel
// @access  Privé
exports.exportExcel = asyncHandler(async (req, res) => {
  // Récupérer les objectifs de l'utilisateur
  const objectifs = await prisma.objectif.findMany({
    where: {
      utilisateurId: req.utilisateur.id,
    },
    orderBy: {
      categorie: "asc",
    },
  })

  // Générer le fichier Excel
  const excelBuffer = await generateExcelReport(objectifs)

  // Définir les en-têtes de réponse
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  res.setHeader("Content-Disposition", "attachment; filename=objectifs.xlsx")

  // Envoyer le fichier Excel
  res.send(excelBuffer)
})

// @desc    Générer un template PDF à remplir au crayon
// @route   GET /api/export/template
// @access  Privé
exports.generateTemplate = asyncHandler(async (req, res) => {
  const { categorie } = req.query

  // Récupérer les objectifs de l'utilisateur (filtrer par catégorie si spécifiée)
  const whereClause = {
    utilisateurId: req.utilisateur.id,
  }

  if (categorie && categorie !== "tous") {
    whereClause.categorie = categorie
  }

  const objectifs = await prisma.objectif.findMany({
    where: whereClause,
    orderBy: {
      categorie: "asc",
    },
  })

  // Générer le template PDF
  const pdfBuffer = await generatePdfTemplate(objectifs)

  // Définir les en-têtes de réponse
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", "attachment; filename=template-objectifs.pdf")

  // Envoyer le PDF
  res.send(pdfBuffer)
})

// Fonction pour générer un rapport PDF
const generatePdfReport = async (objectifs, utilisateur) => {
  return new Promise((resolve) => {
    const chunks = []
    const doc = new PDFDocument({ margin: 50 })

    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))

    // En-tête du document
    doc.fontSize(20).text("Rapport de Suivi d'Objectifs", { align: "center" })
    doc.moveDown()
    doc.fontSize(12).text(`Généré le: ${new Date().toLocaleDateString("fr-FR")}`, { align: "center" })
    doc.moveDown()
    doc.text(`Utilisateur: ${utilisateur.nom || utilisateur.email}`, { align: "center" })
    doc.moveDown(2)

    // Regrouper les objectifs par catégorie
    const objectifsParCategorie = objectifs.reduce((acc, obj) => {
      if (!acc[obj.categorie]) {
        acc[obj.categorie] = []
      }
      acc[obj.categorie].push(obj)
      return acc
    }, {})

    // Parcourir chaque catégorie
    Object.keys(objectifsParCategorie).forEach((categorie, index) => {
      if (index > 0) doc.addPage()

      // Titre de la catégorie
      doc
        .fontSize(16)
        .fillColor("#4caf50")
        .text(
          categorie === "spirituel"
            ? "Objectifs Spirituels"
            : categorie === "professionnel"
              ? "Objectifs Professionnels"
              : "Objectifs Personnels",
          { underline: true },
        )
      doc.moveDown()

      // Parcourir les objectifs de cette catégorie
      objectifsParCategorie[categorie].forEach((obj) => {
        doc.fontSize(14).fillColor("#000").text(obj.nom)

        if (obj.description) {
          doc.fontSize(10).fillColor("#666").text(obj.description)
        }

        doc
          .fontSize(10)
          .fillColor("#333")
          .text(
            `Type: ${
              obj.typeDeTracking === "binaire"
                ? "Binaire (Oui/Non)"
                : obj.typeDeTracking === "compteur"
                  ? "Compteur"
                  : "Valeur numérique"
            }`,
          )

        doc.text(
          `Fréquence: ${
            obj.frequence === "quotidien"
              ? "Quotidienne"
              : obj.frequence === "hebdomadaire"
                ? "Hebdomadaire"
                : "Mensuelle"
          }`,
        )

        if (obj.cible) {
          doc.text(`Objectif cible: ${obj.cible}`)
        }

        // Afficher la progression récente
        doc.moveDown(0.5)
        doc.fontSize(12).fillColor("#000").text("Progression récente:")

        const progression = obj.progression
        const dates = Object.keys(progression).sort().reverse().slice(0, 7)

        if (dates.length > 0) {
          dates.forEach((date) => {
            const valeur = progression[date]
            doc.text(`${date}: ${obj.typeDeTracking === "binaire" ? (valeur ? "Complété" : "Non complété") : valeur}`)
          })
        } else {
          doc.text("Aucune progression enregistrée")
        }

        doc.moveDown(1)
      })
    })

    doc.end()
  })
}

