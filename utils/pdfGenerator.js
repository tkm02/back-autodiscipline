const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")
const { ChartJSNodeCanvas } = require("chartjs-node-canvas")

// Couleurs
const COLORS = {
  primary: "#4caf50",
  secondary: "#2196f3",
  accent: "#ff9800",
  text: "#333333",
  textLight: "#666666",
  background: "#f5f5f5",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  spirituel: "#673ab7",
  professionnel: "#2196f3",
  personnel: "#4caf50",
  headerBg: "#e0e0e0",
  altRowBg: "#f9f9f9",
}

// Palette de couleurs pour les graphiques
const CHART_COLORS = [
  "#4caf50", // vert
  "#2196f3", // bleu
  "#ff9800", // orange
  "#9c27b0", // violet
  "#f44336", // rouge
  "#009688", // teal
  "#795548", // marron
]

// Fonction pour générer un template PDF à remplir au crayon
exports.generatePdfTemplate = async (objectifs) => {
  return new Promise((resolve) => {
    const chunks = []
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      autoFirstPage: false,
    })

    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))

    // Page de couverture
    doc.addPage()
    createCoverPage(doc, "Template de Suivi d'Objectifs", "À remplir manuellement")

    // Page d'instructions
    doc.addPage()
    createInstructionsPage(doc)

    // Regrouper les objectifs par catégorie
    const objectifsParCategorie = objectifs.reduce((acc, obj) => {
      if (!acc[obj.categorie]) {
        acc[obj.categorie] = []
      }
      acc[obj.categorie].push(obj)
      return acc
    }, {})

    // Parcourir chaque catégorie
    Object.keys(objectifsParCategorie).forEach((categorie) => {
      doc.addPage()

      // Ajouter une image de fond légère sur la nouvelle page
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f9f9f9")

      // Titre de la catégorie avec style amélioré
      const categorieColor = COLORS[categorie] || COLORS.primary
      const categorieTitle =
        categorie === "spirituel"
          ? "Objectifs Spirituels"
          : categorie === "professionnel"
            ? "Objectifs Professionnels"
            : "Objectifs Personnels"

      // En-tête de page
      createPageHeader(doc, categorieTitle, categorieColor)

      // Créer un tableau pour les jours de la semaine
      const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

      // Parcourir les objectifs de cette catégorie
      objectifsParCategorie[categorie].forEach((obj, objIndex) => {
        // Vérifier s'il faut ajouter une nouvelle page
        if (doc.y > doc.page.height - 200) {
          doc.addPage()
          doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f9f9f9")
          createPageHeader(doc, categorieTitle, categorieColor)
        }

        // Ajouter un espace entre les objectifs
        if (objIndex > 0) doc.moveDown(1)

        // Cadre pour l'objectif avec ombre
        const startY = doc.y
        drawShadowedRect(doc, 40, startY - 5, doc.page.width - 80, 50, 5, categorieColor)

        // Nom de l'objectif avec style amélioré
        doc
          .fillColor(COLORS.text)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(obj.nom, 50, startY + 5, { width: doc.page.width - 100 })

        if (obj.description) {
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor(COLORS.textLight)
            .text(obj.description, 50, startY + 25, { width: doc.page.width - 100 })
        }

        doc.moveDown(1.5)

        // Créer une grille pour le suivi avec un design amélioré
        const gridStartY = doc.y
        const cellWidth = 65
        const cellHeight = 40
        const headerHeight = 35
        const startX = 50

        // Dessiner l'en-tête de la grille avec un style amélioré
        doc.rect(startX, gridStartY, 150, headerHeight).fillAndStroke("#e0e0e0", categorieColor)
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor(COLORS.text)
          .text("Objectif", startX + 5, gridStartY + 12, { width: 140 })

        // Dessiner les colonnes pour chaque jour avec un style amélioré
        jours.forEach((jour, i) => {
          const x = startX + 150 + i * cellWidth
          doc
            .rect(x, gridStartY, cellWidth, headerHeight)
            .fillAndStroke(i % 2 === 0 ? "#e8e8e8" : "#e0e0e0", categorieColor)
          doc.text(jour, x + 5, gridStartY + 12, { width: cellWidth - 10 })
        })

        // Dessiner la ligne pour cet objectif
        const rowY = gridStartY + headerHeight

        // Colonne objectif
        doc.rect(startX, rowY, 150, cellHeight).fillAndStroke("#f5f5f5", categorieColor)
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(COLORS.text)
          .text(obj.nom, startX + 5, rowY + 5, { width: 140 })

        // Colonnes pour chaque jour
        jours.forEach((jour, i) => {
          const x = startX + 150 + i * cellWidth
          doc.rect(x, rowY, cellWidth, cellHeight).fillAndStroke(i % 2 === 0 ? "#ffffff" : "#f9f9f9", categorieColor)

          // Ajouter des cases à cocher ou des espaces pour remplir selon le type de tracking
          if (obj.typeDeTracking === "binaire") {
            // Dessiner une case à cocher stylisée
            doc.roundedRect(x + cellWidth / 2 - 10, rowY + 10, 20, 20, 3).stroke(COLORS.textLight)
            doc
              .fontSize(8)
              .fillColor(COLORS.textLight)
              .text("Oui / Non", x + 5, rowY + cellHeight - 15, { align: "center", width: cellWidth - 10 })
          } else {
            // Pour les types numériques, ajouter une ligne pour écrire
            doc
              .moveTo(x + 10, rowY + cellHeight - 15)
              .lineTo(x + cellWidth - 10, rowY + cellHeight - 15)
              .stroke(COLORS.textLight)

            // Ajouter une indication de l'unité si disponible
            const unite = obj.unite || ""
            if (unite) {
              doc
                .fontSize(8)
                .fillColor(COLORS.textLight)
                .text(unite, x + cellWidth - 20, rowY + cellHeight - 25)
            }
          }
        })

        doc.moveDown(2)
      })
    })

    // Ajouter des notes en bas de page avec un style amélioré
    doc.addPage()
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f9f9f9")

    // Titre de la page
    doc.fontSize(20).fillColor(COLORS.primary).text("Notes et Observations", { align: "center" })
    doc.moveDown(1)

    // Cadre pour les notes
    drawShadowedRect(doc, 50, doc.y, doc.page.width - 100, 400, 10, COLORS.secondary)

    doc
      .fontSize(14)
      .fillColor(COLORS.secondary)
      .text("Notes:", 60, doc.y + 20)

    // Lignes pour les notes
    const notesStartY = doc.y + 20
    for (let i = 0; i < 12; i++) {
      doc
        .moveTo(60, notesStartY + i * 30)
        .lineTo(doc.page.width - 60, notesStartY + i * 30)
        .stroke(COLORS.textLight)
    }

    // Pied de page
    addFooter(doc)

    doc.end()
  })
}

// Fonction pour générer un rapport PDF
exports.generatePdfReport = async (objectifs, utilisateur, periode = "hebdomadaire") => {
  return new Promise(async (resolve) => {
    const chunks = []
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      autoFirstPage: false,
    })

    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))

    // Page de couverture
    doc.addPage()
    const titreRapport = `Rapport ${
      periode === "hebdomadaire" ? "Hebdomadaire" : periode === "mensuel" ? "Mensuel" : ""
    } de Suivi d'Objectifs`
    createCoverPage(doc, titreRapport, utilisateur.nom || utilisateur.email)

    // Page de résumé
    doc.addPage()
    await createSummaryPage(doc, objectifs, periode)

    // Regrouper les objectifs par catégorie
    const objectifsParCategorie = objectifs.reduce((acc, obj) => {
      if (!acc[obj.categorie]) {
        acc[obj.categorie] = []
      }
      acc[obj.categorie].push(obj)
      return acc
    }, {})

    // Parcourir chaque catégorie
    for (const categorie of Object.keys(objectifsParCategorie)) {
      doc.addPage()

      // Ajouter une image de fond légère sur la nouvelle page
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f9f9f9")

      // Titre de la catégorie avec style amélioré
      const categorieColor = COLORS[categorie] || COLORS.primary
      const categorieTitle =
        categorie === "spirituel"
          ? "Objectifs Spirituels"
          : categorie === "professionnel"
            ? "Objectifs Professionnels"
            : "Objectifs Personnels"

      // En-tête de page
      createPageHeader(doc, categorieTitle, categorieColor)

      // Ajouter un graphique de progression pour cette catégorie
      await addCategoryProgressChart(doc, objectifsParCategorie[categorie], categorie, periode)

      // Parcourir les objectifs de cette catégorie
      for (const obj of objectifsParCategorie[categorie]) {
        // Vérifier s'il faut ajouter une nouvelle page
        if (doc.y > doc.page.height - 250) {
          doc.addPage()
          doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f9f9f9")
          createPageHeader(doc, categorieTitle, categorieColor)
        }

        // Cadre pour l'objectif avec ombre
        const startY = doc.y
        drawShadowedRect(doc, 40, startY, doc.page.width - 80, 100, 5, categorieColor)

        // Nom de l'objectif avec style amélioré
        doc
          .fillColor(COLORS.text)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(obj.nom, 50, startY + 10, { width: doc.page.width - 100 })

        if (obj.description) {
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor(COLORS.textLight)
            .text(obj.description, 50, startY + 30, { width: doc.page.width - 100 })
        }

        // Informations sur l'objectif
        const infoY = startY + (obj.description ? 50 : 30)
        doc
          .fontSize(10)
          .fillColor(COLORS.text)
          .text(
            `Type: ${
              obj.typeDeTracking === "binaire"
                ? "Binaire (Oui/Non)"
                : obj.typeDeTracking === "compteur"
                  ? "Compteur"
                  : "Valeur numérique"
            }`,
            50,
            infoY,
          )

        doc.text(
          `Fréquence: ${
            obj.frequence === "quotidien"
              ? "Quotidienne"
              : obj.frequence === "hebdomadaire"
                ? "Hebdomadaire"
                : "Mensuelle"
          }`,
          250,
          infoY,
        )

        if (obj.cible) {
          doc.text(`Objectif cible: ${obj.cible}`, 400, infoY)
        }

        doc.moveDown(2)

        // Ajouter un graphique de progression pour cet objectif
        await addObjectiveProgressChart(doc, obj, periode)

        // Afficher la progression récente avec un style amélioré
        doc
          .fontSize(12)
          .fillColor(categorieColor)
          .text("Progression détaillée:", 50, doc.y + 10)

        doc.moveDown(0.5)

        // Créer un tableau pour la progression
        const progression = obj.progression || {}
        const dates = Object.keys(progression).sort().reverse()

        // Limiter le nombre de dates selon la période
        const nbDates = periode === "hebdomadaire" ? 7 : 30
        const datesToShow = dates.slice(0, nbDates)

        if (datesToShow.length > 0) {
          // En-tête du tableau
          const tableStartY = doc.y
          const dateWidth = 100
          const valueWidth = 100
          const commentWidth = 250

          doc.rect(50, tableStartY, dateWidth, 25).fillAndStroke("#e0e0e0", categorieColor)
          doc.rect(50 + dateWidth, tableStartY, valueWidth, 25).fillAndStroke("#e0e0e0", categorieColor)
          doc.rect(50 + dateWidth + valueWidth, tableStartY, commentWidth, 25).fillAndStroke("#e0e0e0", categorieColor)

          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor(COLORS.text)
            .text("Date", 60, tableStartY + 8)
            .text("Valeur", 60 + dateWidth, tableStartY + 8)
            .text("Commentaire", 60 + dateWidth + valueWidth, tableStartY + 8)

          // Lignes du tableau
          for (let i = 0; i < datesToShow.length; i++) {
            const date = datesToShow[i]
            const rowY = tableStartY + 25 + i * 25
            const valeur = progression[date]
            const commentaire = obj.commentaires && obj.commentaires[date] ? obj.commentaires[date] : ""

            // Vérifier s'il faut ajouter une nouvelle page
            if (rowY + 25 > doc.page.height - 50) {
              doc.addPage()
              doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f9f9f9")
              createPageHeader(doc, categorieTitle, categorieColor)

              // Redessiner l'en-tête du tableau
              const newTableStartY = doc.y
              doc.rect(50, newTableStartY, dateWidth, 25).fillAndStroke("#e0e0e0", categorieColor)
              doc.rect(50 + dateWidth, newTableStartY, valueWidth, 25).fillAndStroke("#e0e0e0", categorieColor)
              doc
                .rect(50 + dateWidth + valueWidth, newTableStartY, commentWidth, 25)
                .fillAndStroke("#e0e0e0", categorieColor)

              doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .fillColor(COLORS.text)
                .text("Date", 60, newTableStartY + 8)
                .text("Valeur", 60 + dateWidth, newTableStartY + 8)
                .text("Commentaire", 60 + dateWidth + valueWidth, newTableStartY + 8)

              // Réinitialiser le compteur et la position Y
              i = -1 // Sera incrémenté à 0 dans la prochaine itération
              tableStartY = newTableStartY
              continue
            }

            // Alterner les couleurs de fond
            const fillColor = i % 2 === 0 ? "#f5f5f5" : "#ffffff"

            doc.rect(50, rowY, dateWidth, 25).fillAndStroke(fillColor, categorieColor)
            doc.rect(50 + dateWidth, rowY, valueWidth, 25).fillAndStroke(fillColor, categorieColor)
            doc.rect(50 + dateWidth + valueWidth, rowY, commentWidth, 25).fillAndStroke(fillColor, categorieColor)

            doc
              .fontSize(9)
              .font("Helvetica")
              .fillColor(COLORS.text)
              .text(formatDate(date), 60, rowY + 8)
              .text(
                obj.typeDeTracking === "binaire" ? (valeur ? "Complété" : "Non complété") : valeur,
                60 + dateWidth,
                rowY + 8,
              )
              .text(commentaire, 60 + dateWidth + valueWidth, rowY + 8, { width: commentWidth - 20 })
          }
        } else {
          doc.text("Aucune progression enregistrée")
        }

        doc.moveDown(3)
      }
    }

    // Pied de page
    addFooter(doc)

    doc.end()
  })
}

// Fonction pour créer la page de couverture
function createCoverPage(doc, title, subtitle) {
  // Fond de page
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f5f5f5")

  // Bordure décorative
  doc
    .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
    .lineWidth(2)
    .stroke(COLORS.primary)

  // Logo ou image décorative (simulé par un cercle coloré)
  doc.circle(doc.page.width / 2, 150, 50).fillAndStroke(COLORS.primary, COLORS.primary)

  // Titre principal
  doc.fontSize(28).font("Helvetica-Bold").fillColor(COLORS.text).text(title, 0, 250, { align: "center" })

  // Sous-titre
  doc.fontSize(16).font("Helvetica").fillColor(COLORS.textLight).text(subtitle, 0, 300, { align: "center" })

  // Date de génération
  const dateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  const dateStr = new Date().toLocaleDateString("fr-FR", dateOptions)

  doc.fontSize(12).fillColor(COLORS.textLight).text(`Généré le ${dateStr}`, 0, 350, { align: "center" })

  // Motif décoratif en bas de page
  for (let i = 0; i < 10; i++) {
    doc.circle(50 + i * 55, doc.page.height - 100, 10).fill(i % 2 === 0 ? COLORS.primary : COLORS.secondary)
  }
}

// Fonction pour créer la page d'instructions
function createInstructionsPage(doc) {
  // Fond de page
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f9f9f9")

  // Titre de la page
  doc.fontSize(24).font("Helvetica-Bold").fillColor(COLORS.primary).text("Comment utiliser ce template", 50, 50)

  doc.moveDown(1)

  // Instructions
  const instructions = [
    {
      title: "1. Remplissez quotidiennement",
      text: "Pour chaque objectif, notez votre progression quotidienne dans la case correspondant au jour de la semaine.",
    },
    {
      title: "2. Objectifs binaires (Oui/Non)",
      text: "Pour les objectifs de type binaire, cochez la case si l'objectif a été atteint ce jour-là.",
    },
    {
      title: "3. Objectifs numériques",
      text: "Pour les objectifs avec des valeurs numériques, inscrivez la valeur atteinte (ex: 5 km, 30 minutes, etc.).",
    },
    {
      title: "4. Utilisez la page de notes",
      text: "La dernière page vous permet de noter vos observations, difficultés ou succès particuliers.",
    },
    {
      title: "5. Analysez votre progression",
      text: "À la fin de la semaine, prenez le temps d'analyser votre progression et d'ajuster vos objectifs si nécessaire.",
    },
  ]

  instructions.forEach((instruction, index) => {
    // Titre de l'instruction
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(COLORS.text)
      .text(instruction.title, 50, doc.y + 10)

    // Texte de l'instruction
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(COLORS.textLight)
      .text(instruction.text, 70, doc.y + 5, { width: doc.page.width - 140 })

    doc.moveDown(1)
  })

  // Conseils supplémentaires
  doc.moveDown(1)
  doc.fontSize(16).font("Helvetica-Bold").fillColor(COLORS.secondary).text("Conseils pour réussir", 50, doc.y)

  doc.moveDown(0.5)

  const conseils = [
    "Soyez régulier dans votre suivi pour maintenir votre motivation.",
    "Célébrez vos petites victoires, même si elles semblent insignifiantes.",
    "Si vous manquez un jour, ne vous découragez pas et reprenez dès le lendemain.",
    "Ajustez vos objectifs s'ils sont trop faciles ou trop difficiles.",
    "Partagez vos progrès avec un ami ou un mentor pour plus de responsabilité.",
  ]

  conseils.forEach((conseil) => {
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(COLORS.textLight)
      .text(`• ${conseil}`, 70, doc.y, { width: doc.page.width - 140 })

    doc.moveDown(0.5)
  })
}

// Fonction pour créer l'en-tête de page
function createPageHeader(doc, title, color) {
  // Barre de couleur en haut de la page
  doc.rect(0, 0, doc.page.width, 15).fill(color)

  // Titre de la page
  doc.fontSize(20).font("Helvetica-Bold").fillColor(color).text(title, 50, 30)

  // Ligne de séparation
  doc
    .moveTo(50, 60)
    .lineTo(doc.page.width - 50, 60)
    .lineWidth(1)
    .stroke(color)

  doc.moveDown(2)
}

// Fonction pour créer la page de résumé
async function createSummaryPage(doc, objectifs, periode) {
  // Fond de page
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f9f9f9")

  // Titre de la page
  doc.fontSize(24).font("Helvetica-Bold").fillColor(COLORS.primary).text("Résumé de votre progression", 50, 50)

  doc.moveDown(1)

  // Statistiques globales
  const stats = calculateStats(objectifs, periode)

  // Cadre pour les statistiques
  drawShadowedRect(doc, 50, doc.y, doc.page.width - 100, 120, 5, COLORS.secondary)

  // Titre du cadre
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor(COLORS.secondary)
    .text("Statistiques globales", 70, doc.y + 20)

  // Afficher les statistiques
  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor(COLORS.text)
    .text(`Nombre total d'objectifs: ${stats.totalObjectifs}`, 70, doc.y + 10)
    .text(`Taux de complétion global: ${stats.tauxCompletionGlobal.toFixed(2)}%`, 70, doc.y + 5)
    .text(`Objectifs les plus performants: ${stats.objectifsPerformants}`, 70, doc.y + 5)
    .text(`Objectifs à améliorer: ${stats.objectifsAmeliorer}`, 70, doc.y + 5)

  doc.moveDown(4)

  // Ajouter un graphique de répartition des objectifs par catégorie
  await addCategoriesChart(doc, objectifs)

  doc.moveDown(2)

  // Ajouter un graphique de progression globale
  await addGlobalProgressChart(doc, objectifs, periode)

  doc.moveDown(2)

  // Recommandations
  doc.fontSize(16).font("Helvetica-Bold").fillColor(COLORS.primary).text("Recommandations", 50, doc.y)

  doc.moveDown(0.5)

  // Générer des recommandations basées sur les statistiques
  const recommandations = generateRecommendations(stats)

  recommandations.forEach((reco) => {
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(COLORS.text)
      .text(`• ${reco}`, 70, doc.y, { width: doc.page.width - 140 })

    doc.moveDown(0.5)
  })
}

// Fonction pour calculer les statistiques
function calculateStats(objectifs, periode) {
  // Nombre total d'objectifs
  const totalObjectifs = objectifs.length

  // Calculer le taux de complétion global
  let totalCompletions = 0
  let totalJours = 0

  // Déterminer la période d'analyse
  const aujourdhui = new Date()
  const debutPeriode = new Date(aujourdhui)
  if (periode === "hebdomadaire") {
    debutPeriode.setDate(aujourdhui.getDate() - 7)
  } else if (periode === "mensuel") {
    debutPeriode.setMonth(aujourdhui.getMonth() - 1)
  }

  // Calculer les performances par objectif
  const performancesParObjectif = objectifs.map((obj) => {
    let completions = 0
    let jours = 0

    // Parcourir chaque jour de la période
    for (let d = new Date(debutPeriode); d <= aujourdhui; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]

      if (obj.progression && obj.progression[dateStr] !== undefined) {
        jours++

        if (obj.typeDeTracking === "binaire") {
          if (obj.progression[dateStr] === true) {
            completions++
          }
        } else {
          // Pour les objectifs numériques, considérer comme complété si > 0
          if (obj.progression[dateStr] > 0) {
            completions++
          }
        }
      }
    }

    totalCompletions += completions
    totalJours += jours

    const tauxCompletion = jours > 0 ? (completions / jours) * 100 : 0

    return {
      id: obj.id,
      nom: obj.nom,
      tauxCompletion,
      jours,
    }
  })

  // Trier les objectifs par taux de complétion
  performancesParObjectif.sort((a, b) => b.tauxCompletion - a.tauxCompletion)

  // Objectifs les plus performants (top 3)
  const objectifsPerformants = performancesParObjectif
    .slice(0, 3)
    .filter((obj) => obj.jours > 0)
    .map((obj) => obj.nom)
    .join(", ")

  // Objectifs à améliorer (3 derniers)
  const objectifsAmeliorer = performancesParObjectif
    .slice(-3)
    .filter((obj) => obj.jours > 0)
    .map((obj) => obj.nom)
    .join(", ")

  // Taux de complétion global
  const tauxCompletionGlobal = totalJours > 0 ? (totalCompletions / totalJours) * 100 : 0

  return {
    totalObjectifs,
    tauxCompletionGlobal,
    objectifsPerformants: objectifsPerformants || "Aucun",
    objectifsAmeliorer: objectifsAmeliorer || "Aucun",
  }
}

// Fonction pour générer des recommandations
function generateRecommendations(stats) {
  const recommandations = []

  // Recommandations basées sur le taux de complétion global
  if (stats.tauxCompletionGlobal < 30) {
    recommandations.push(
      "Votre taux de complétion est faible. Essayez de simplifier vos objectifs ou de réduire leur nombre pour vous concentrer sur les plus importants.",
    )
    recommandations.push("Mettez en place des rappels quotidiens pour vous aider à suivre vos objectifs régulièrement.")
  } else if (stats.tauxCompletionGlobal < 70) {
    recommandations.push(
      "Votre progression est correcte, mais il y a encore de la marge d'amélioration. Identifiez les obstacles qui vous empêchent d'atteindre certains objectifs.",
    )
    recommandations.push(
      "Essayez de créer une routine quotidienne pour intégrer vos objectifs dans votre emploi du temps.",
    )
  } else {
    recommandations.push(
      "Excellent travail ! Votre taux de complétion est très bon. Envisagez d'augmenter légèrement la difficulté de vos objectifs pour continuer à progresser.",
    )
    recommandations.push(
      "Partagez votre expérience et vos méthodes avec d'autres personnes pour les aider à progresser également.",
    )
  }

  // Recommandations spécifiques aux objectifs
  if (stats.objectifsAmeliorer !== "Aucun") {
    recommandations.push(
      `Concentrez-vous sur l'amélioration de ces objectifs: ${stats.objectifsAmeliorer}. Identifiez les obstacles et ajustez vos stratégies.`,
    )
  }

  if (stats.objectifsPerformants !== "Aucun") {
    recommandations.push(
      `Continuez sur votre lancée avec ces objectifs performants: ${stats.objectifsPerformants}. Utilisez les stratégies qui fonctionnent ici pour les appliquer à d'autres objectifs.`,
    )
  }

  return recommandations
}

// Fonction pour ajouter un graphique de répartition des objectifs par catégorie
async function addCategoriesChart(doc, objectifs) {
  // Calculer le nombre d'objectifs par catégorie
  const categoriesCount = {
    spirituel: objectifs.filter((obj) => obj.categorie === "spirituel").length,
    professionnel: objectifs.filter((obj) => obj.categorie === "professionnel").length,
    personnel: objectifs.filter((obj) => obj.categorie === "personnel").length,
  }

  // Créer le graphique avec Chart.js
  const width = 400
  const height = 300
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: "#f9f9f9" })

  const configuration = {
    type: "pie",
    data: {
      labels: ["Spirituel", "Professionnel", "Personnel"],
      datasets: [
        {
          data: [categoriesCount.spirituel, categoriesCount.professionnel, categoriesCount.personnel],
          backgroundColor: [COLORS.spirituel, COLORS.professionnel, COLORS.personnel],
          borderColor: "#ffffff",
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Répartition des objectifs par catégorie",
          font: {
            size: 16,
            weight: "bold",
          },
        },
        legend: {
          position: "bottom",
        },
      },
    },
  }

  // Générer l'image du graphique
  const image = await chartJSNodeCanvas.renderToBuffer(configuration)

  // Ajouter l'image au document PDF
  const imgX = (doc.page.width - width) / 2
  doc.image(image, imgX, doc.y, { width, height })

  doc.moveDown(height / 20) // Ajouter de l'espace après le graphique
}

// Fonction pour ajouter un graphique de progression globale
async function addGlobalProgressChart(doc, objectifs, periode) {
  // Déterminer la période d'analyse
  const aujourdhui = new Date()
  const debutPeriode = new Date(aujourdhui)
  const nbJours = periode === "hebdomadaire" ? 7 : 30
  debutPeriode.setDate(aujourdhui.getDate() - nbJours + 1)

  // Préparer les données pour le graphique
  const labels = []
  const completionData = []

  // Générer les dates pour la période
  for (let d = new Date(debutPeriode); d <= aujourdhui; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    labels.push(formatDate(dateStr))

    // Calculer le taux de complétion pour cette date
    let completions = 0
    let totalObjectifs = 0

    objectifs.forEach((obj) => {
      if (obj.progression && obj.progression[dateStr] !== undefined) {
        totalObjectifs++
        if (obj.typeDeTracking === "binaire") {
          if (obj.progression[dateStr] === true) {
            completions++
          }
        } else {
          if (obj.progression[dateStr] > 0) {
            completions++
          }
        }
      }
    })

    const tauxCompletion = totalObjectifs > 0 ? (completions / totalObjectifs) * 100 : 0
    completionData.push(tauxCompletion)
  }

  // Créer le graphique avec Chart.js
  const width = 500
  const height = 300
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: "#f9f9f9" })

  const configuration = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Taux de complétion (%)",
          data: completionData,
          backgroundColor: "rgba(33, 150, 243, 0.2)",
          borderColor: COLORS.secondary,
          borderWidth: 2,
          pointBackgroundColor: COLORS.secondary,
          tension: 0.3,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Évolution du taux de complétion",
          font: {
            size: 16,
            weight: "bold",
          },
        },
        legend: {
          position: "bottom",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Taux de complétion (%)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
      },
    },
  }

  // Générer l'image du graphique
  const image = await chartJSNodeCanvas.renderToBuffer(configuration)

  // Ajouter l'image au document PDF
  const imgX = (doc.page.width - width) / 2
  doc.image(image, imgX, doc.y, { width, height })

  doc.moveDown(height / 20) // Ajouter de l'espace après le graphique
}

// Fonction pour ajouter un graphique de progression pour une catégorie
async function addCategoryProgressChart(doc, objectifs, categorie, periode) {
  // Déterminer la période d'analyse
  const aujourdhui = new Date()
  const debutPeriode = new Date(aujourdhui)
  const nbJours = periode === "hebdomadaire" ? 7 : 30
  debutPeriode.setDate(aujourdhui.getDate() - nbJours + 1)

  // Préparer les données pour le graphique
  const labels = []
  const datasets = []

  // Générer les dates pour la période
  for (let d = new Date(debutPeriode); d <= aujourdhui; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    labels.push(formatDate(dateStr))
  }

  // Limiter à 5 objectifs maximum pour la lisibilité
  const objectifsToShow = objectifs.slice(0, 5)

  // Créer un dataset pour chaque objectif
  objectifsToShow.forEach((obj, index) => {
    const data = []

    // Pour chaque date, récupérer la valeur de progression
    for (let d = new Date(debutPeriode); d <= aujourdhui; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]

      if (obj.progression && obj.progression[dateStr] !== undefined) {
        if (obj.typeDeTracking === "binaire") {
          data.push(obj.progression[dateStr] ? 100 : 0)
        } else {
          // Pour les objectifs numériques, normaliser par rapport à la cible
          if (obj.cible && obj.cible > 0) {
            const pourcentage = (obj.progression[dateStr] / obj.cible) * 100
            data.push(Math.min(pourcentage, 100)) // Limiter à 100%
          } else {
            data.push(obj.progression[dateStr] > 0 ? 100 : 0)
          }
        }
      } else {
        data.push(null) // Pas de données pour cette date
      }
    }

    datasets.push({
      label: obj.nom,
      data: data,
      backgroundColor: `rgba(${index * 50}, 150, 243, 0.2)`,
      borderColor: CHART_COLORS[index % CHART_COLORS.length],
      borderWidth: 2,
      pointBackgroundColor: CHART_COLORS[index % CHART_COLORS.length],
      tension: 0.3,
    })
  })

  // Créer le graphique avec Chart.js
  const width = 500
  const height = 300
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: "#f9f9f9" })

  const configuration = {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Progression des objectifs",
          font: {
            size: 16,
            weight: "bold",
          },
        },
        legend: {
          position: "bottom",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Progression (%)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
      },
    },
  }

  // Générer l'image du graphique
  const image = await chartJSNodeCanvas.renderToBuffer(configuration)

  // Ajouter l'image au document PDF
  const imgX = (doc.page.width - width) / 2
  doc.image(image, imgX, doc.y, { width, height })

  doc.moveDown(height / 20) // Ajouter de l'espace après le graphique
}

// Fonction pour ajouter un graphique de progression pour un objectif spécifique
async function addObjectiveProgressChart(doc, objectif, periode) {
  // Déterminer la période d'analyse
  const aujourdhui = new Date()
  const debutPeriode = new Date(aujourdhui)
  const nbJours = periode === "hebdomadaire" ? 7 : 30
  debutPeriode.setDate(aujourdhui.getDate() - nbJours + 1)

  // Préparer les données pour le graphique
  const labels = []
  const progressionData = []

  // Générer les dates pour la période
  for (let d = new Date(debutPeriode); d <= aujourdhui; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    labels.push(formatDate(dateStr))

    // Récupérer la valeur de progression pour cette date
    if (objectif.progression && objectif.progression[dateStr] !== undefined) {
      if (objectif.typeDeTracking === "binaire") {
        progressionData.push(objectif.progression[dateStr] ? 100 : 0)
      } else {
        // Pour les objectifs numériques, normaliser par rapport à la cible
        if (objectif.cible && objectif.cible > 0) {
          const pourcentage = (objectif.progression[dateStr] / objectif.cible) * 100
          progressionData.push(Math.min(pourcentage, 100)) // Limiter à 100%
        } else {
          progressionData.push(objectif.progression[dateStr])
        }
      }
    } else {
      progressionData.push(null) // Pas de données pour cette date
    }
  }

  // Créer le graphique avec Chart.js
  const width = 400
  const height = 200
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: "#f9f9f9" })

  const configuration = {
    type: objectif.typeDeTracking === "binaire" ? "bar" : "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Progression",
          data: progressionData,
          backgroundColor:
            objectif.typeDeTracking === "binaire"
              ? progressionData.map((val) => (val === 100 ? COLORS.success : COLORS.error))
              : "rgba(76, 175, 80, 0.2)",
          borderColor: COLORS.success,
          borderWidth: 2,
          pointBackgroundColor: COLORS.success,
          tension: 0.3,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Progression de l'objectif",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: objectif.typeDeTracking === "binaire" ? "Complété (%)" : "Valeur",
          },
        },
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
      },
    },
  }

  // Générer l'image du graphique
  const image = await chartJSNodeCanvas.renderToBuffer(configuration)

  // Ajouter l'image au document PDF
  const imgX = (doc.page.width - width) / 2
  doc.image(image, imgX, doc.y, { width, height })

  doc.moveDown(height / 20) // Ajouter de l'espace après le graphique
}

// Fonction utilitaire pour dessiner un rectangle avec ombre
function drawShadowedRect(doc, x, y, width, height, radius, color) {
  // Dessiner l'ombre
  doc
    .roundedRect(x + 3, y + 3, width, height, radius)
    .fillOpacity(0.3)
    .fill("#000000")
    .fillOpacity(1)

  // Dessiner le rectangle principal
  doc.roundedRect(x, y, width, height, radius).fillAndStroke("#ffffff", color)
}

// Fonction pour ajouter un pied de page
function addFooter(doc) {
  const pageHeight = doc.page.height

  // Ligne de séparation
  doc
    .moveTo(50, pageHeight - 70)
    .lineTo(doc.page.width - 50, pageHeight - 70)
    .lineWidth(0.5)
    .stroke(COLORS.textLight)

  doc
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .text(`Rapport généré le ${new Date().toLocaleDateString("fr-FR")} - Suivi d'Objectifs`, 50, pageHeight - 50, {
      align: "center",
    })
}

// Fonction pour formater une date
function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
} 
 