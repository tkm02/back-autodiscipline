const { PrismaClient } = require("@prisma/client")
const PDFDocument = require("pdfkit")
const ExcelJS = require("exceljs")
const fs = require("fs")
const path = require("path")
const asyncHandler = require("../utils/asyncHandler")
const { generatePdfTemplate } = require("../utils/pdfGenerator")
const { generateExcelReport } = require("../utils/excelGenerator")
const { generatePdfReport } = require("../utils/pdfGenerator")

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
