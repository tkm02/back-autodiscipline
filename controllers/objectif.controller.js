const { PrismaClient } = require("@prisma/client")
const asyncHandler = require("../utils/asyncHandler")

const prisma = new PrismaClient()

// @desc    Créer un nouvel objectif
// @route   POST /api/objectifs
// @access  Privé
// exports.createObjectif = asyncHandler(async (req, res) => {
//   // Ajouter l'ID de l'utilisateur à l'objectif
//   req.body.utilisateurId = req.utilisateur.id

//   // Initialiser la durée par défaut si non spécifiée
//   if (!req.body.duree) {
//     req.body.duree = 90 // 3 mois par défaut
//   }

//   // Initialiser la date de début si non spécifiée
//   if (!req.body.dateDebut) {
//     req.body.dateDebut = new Date().toISOString().split("T")[0]
//   }

//   // Initialiser la progression à false pour aujourd'hui
//   const today = new Date().toISOString().split("T")[0]
//   const progression = {}

//   if (req.body.typeDeTracking === "binaire") {
//     progression[today] = false
//   }

//   // Créer l'objectif
//   const objectif = await prisma.objectif.create({
//     data: {
//       nom: req.body.nom,
//       categorie: req.body.categorie,
//       typeDeTracking: req.body.typeDeTracking,
//       frequence: req.body.frequence,
//       cible: req.body.cible || null,
//       description: req.body.description || null,
//       statut: req.body.statut || "en_cours",
//       progression: progression,
//       commentaires: req.body.commentaires || {},
//       duree: req.body.duree,
//       dateDebut: req.body.dateDebut,
//       utilisateurId: req.body.utilisateurId,
//     },
//   })

//   res.status(201).json({
//     success: true,
//     data: objectif,
//   })
// })

// @desc    Supprimer un objectif
// @route   DELETE /api/objectifs/:id
// @access  Privé
exports.deleteObjectif = asyncHandler(async (req, res) => {
  const objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à supprimer cet objectif",
    })
  }

  await prisma.objectif.delete({
    where: {
      id: req.params.id,
    },
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})
 
// @desc    Récupérer tous les objectifs
// @route   GET /api/objectifs
// @access  Privé
exports.getObjectifs = asyncHandler(async (req, res) => {
  const objectifs = await prisma.objectif.findMany({
    where: {
      utilisateurId: req.utilisateur.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Vérifier et mettre à jour les objectifs non complétés pour les jours passés
  const today = new Date().toISOString().split("T")[0]
  const updatedObjectifs = await Promise.all(
    objectifs.map(async (obj) => {
      let updated = false
      const progression = { ...obj.progression }

      // Si l'objectif est en cours et de type binaire
      if (obj.statut === "en_cours" && obj.typeDeTracking === "binaire") {
        const dateDebut = new Date(obj.dateDebut || obj.createdAt)
        const currentDate = new Date()

        // Parcourir tous les jours depuis le début jusqu'à hier
        for (let d = new Date(dateDebut); d < currentDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0]

          // Si la date est aujourd'hui, ne pas la traiter
          if (dateStr === today) continue

          // Si la progression n'existe pas pour cette date, la définir à false
          if (progression[dateStr] === undefined) {
            progression[dateStr] = false
            updated = true
          }
        }

        if (updated) {
          await prisma.objectif.update({
            where: { id: obj.id },
            data: { progression },
          })

          obj.progression = progression
        }
      }

      return obj
    }),
  )

  res.status(200).json({
    success: true,
    count: updatedObjectifs.length,
    data: updatedObjectifs,
  })
})

// @desc    Récupérer un objectif par ID
// @route   GET /api/objectifs/:id
// @access  Privé
exports.getObjectif = asyncHandler(async (req, res) => {
  const objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à accéder à cet objectif",
    })
  }

  res.status(200).json({
    success: true,
    data: objectif,
  })
})

// @desc    Mettre à jour un objectif
// @route   PUT /api/objectifs/:id
// @access  Privé
exports.updateObjectif = asyncHandler(async (req, res) => {
  let objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à modifier cet objectif",
    })
  }

  const cible = req.body.cible === "" ? null : req.body.cible;

  // Mettre à jour l'objectif
  objectif = await prisma.objectif.update({
    where: {
      id: req.params.id,
    },
    data: {
      nom: req.body.nom || objectif.nom,
      categorie: req.body.categorie || objectif.categorie,
      typeDeTracking: req.body.typeDeTracking || objectif.typeDeTracking,
      frequence: req.body.frequence || objectif.frequence,
      // cible: req.body.cible !== undefined ? req.body.cible : objectif.cible,
      cible: cible !== undefined ? parseFloat(cible) || null : objectif.cible,
      description: req.body.description !== undefined ? req.body.description : objectif.description,
      statut: req.body.statut || objectif.statut,
      progression: req.body.progression || objectif.progression,
      commentaires: req.body.commentaires || objectif.commentaires,
      duree: req.body.duree || objectif.duree || 90,
      dateDebut: req.body.dateDebut || objectif.dateDebut || objectif.createdAt.toISOString().split("T")[0],
    },
  })

  res.status(200).json({
    success: true,
    data: objectif,
  })
})

// @desc    Mettre à jour le statut d'un objectif
// @route   PATCH /api/objectifs/:id/statut
// @access  Privé
exports.updateStatut = asyncHandler(async (req, res) => {
  const { statut } = req.body

  if (!statut) {
    return res.status(400).json({
      success: false,
      error: "Veuillez fournir un statut",
    })
  }

  let objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à modifier cet objectif",
    })
  }

  // Mettre à jour le statut
  objectif = await prisma.objectif.update({
    where: {
      id: req.params.id,
    },
    data: {
      statut,
    },
  })

  res.status(200).json({
    success: true,
    data: objectif,
  })
})

// @desc    Mettre à jour la progression d'un objectif
// @route   PATCH /api/objectifs/:id/progression
// @access  Privé
// exports.updateProgression = asyncHandler(async (req, res) => {
//   const { date, valeur } = req.body

//   if (!date || valeur === undefined) {
//     return res.status(400).json({
//       success: false,
//       error: "Veuillez fournir une date et une valeur",
//     })
//   }

//   let objectif = await prisma.objectif.findUnique({
//     where: {
//       id: req.params.id,
//     },
//   })

//   if (!objectif) {
//     return res.status(404).json({
//       success: false,
//       error: "Objectif non trouvé",
//     })
//   }

//   // Vérifier que l'objectif appartient à l'utilisateur
//   if (objectif.utilisateurId !== req.utilisateur.id) {
//     return res.status(401).json({
//       success: false,
//       error: "Non autorisé à modifier cet objectif",
//     })
//   }

//   // Mettre à jour la progression
//   const progression = { ...objectif.progression }
//   progression[date] = valeur

//   objectif = await prisma.objectif.update({
//     where: {
//       id: req.params.id,
//     },
//     data: {
//       progression,
//     },
//   })

//   res.status(200).json({
//     success: true,
//     data: objectif,
//   })
// })

// @desc    Mettre à jour les progressions manquantes
// @route   POST /api/objectifs/update-missing-progressions
// @access  Privé
// exports.updateMissingProgressions = asyncHandler(async (req, res) => {
//   const objectifs = await prisma.objectif.findMany({
//     where: {
//       utilisateurId: req.utilisateur.id,
//       statut: "en_cours",
//       typeDeTracking: "binaire",
//     },
//   })

//   const today = new Date().toISOString().split("T")[0]
//   let updatedCount = 0

//   await Promise.all(
//     objectifs.map(async (obj) => {
//       let updated = false
//       const progression = { ...obj.progression }

//       const dateDebut = new Date(obj.dateDebut || obj.createdAt)
//       const currentDate = new Date()

//       // Parcourir tous les jours depuis le début jusqu'à hier
//       for (let d = new Date(dateDebut); d < currentDate; d.setDate(d.getDate() + 1)) {
//         const dateStr = d.toISOString().split("T")[0]

//         // Si la date est aujourd'hui, ne pas la traiter
//         if (dateStr === today) continue

//         // Si la progression n'existe pas pour cette date, la définir à false
//         if (progression[dateStr] === undefined) {
//           progression[dateStr] = false
//           updated = true
//         }
//       }

//       if (updated) {
//         await prisma.objectif.update({
//           where: { id: obj.id },
//           data: { progression },
//         })

//         updatedCount++
//       }

//       return obj
//     }),
//   )

//   res.status(200).json({
//     success: true,
//     message: `${updatedCount} objectifs ont été mis à jour avec les progressions manquantes.`,
//   })
// })

// @desc    Obtenir les statistiques des objectifs
// @route   GET /api/objectifs/statistiques
// @access  Privé
exports.getStatistiques = asyncHandler(async (req, res) => {
  const objectifs = await prisma.objectif.findMany({
    where: {
      utilisateurId: req.utilisateur.id,
    },
  })

  const today = new Date().toISOString().split("T")[0]

  // Nombre total d'objectifs
  const totalObjectifs = objectifs.length

  // Objectifs en cours
  const objectifsEnCours = objectifs.filter((obj) => obj.statut === "en_cours").length

  // Objectifs complétés aujourd'hui
  let completesAujourdhui = 0
  let totalObjectifsAujourdhui = 0

  objectifs.forEach((obj) => {
    if (obj.statut === "en_cours") {
      // Vérifier si l'objectif est actif aujourd'hui
      const dateDebut = new Date(obj.dateDebut || obj.createdAt)
      const dateFin = new Date(dateDebut)
      dateFin.setDate(dateFin.getDate() + (obj.duree || 90))
      const currentDate = new Date(today)

      if (currentDate >= dateDebut && currentDate <= dateFin) {
        totalObjectifsAujourdhui++

        if (obj.progression[today] !== undefined) {
          if (obj.typeDeTracking === "binaire") {
            if (obj.progression[today] === true) {
              completesAujourdhui++
            }
          } else if (obj.progression[today] > 0) {
            completesAujourdhui++
          }
        }
      }
    }
  })

  // Taux de complétion global
  let totalJoursTrackes = 0
  let totalJoursCompletes = 0

  objectifs.forEach((obj) => {
    Object.entries(obj.progression).forEach(([date, value]) => {
      // Vérifier si l'objectif était actif à cette date
      const dateDebut = new Date(obj.dateDebut || obj.createdAt)
      const dateFin = new Date(dateDebut)
      dateFin.setDate(dateFin.getDate() + (obj.duree || 90))
      const currentDate = new Date(date)

      if (currentDate >= dateDebut && currentDate <= dateFin) {
        totalJoursTrackes++

        if (obj.typeDeTracking === "binaire") {
          if (value === true) {
            totalJoursCompletes++
          }
        } else if (value > 0) {
          totalJoursCompletes++
        }
      }
    })
  })

  const tauxCompletionGlobal = totalJoursTrackes > 0 ? (totalJoursCompletes / totalJoursTrackes) * 100 : 0

  // Statistiques par catégorie
  const categoriesStats = {
    spirituel: calculateCategoryStats(
      objectifs.filter((obj) => obj.categorie === "spirituel"),
      today,
    ),
    professionnel: calculateCategoryStats(
      objectifs.filter((obj) => obj.categorie === "professionnel"),
      today,
    ),
    personnel: calculateCategoryStats(
      objectifs.filter((obj) => obj.categorie === "personnel"),
      today,
    ),
    finance: calculateCategoryStats(
      objectifs.filter((obj) => obj.categorie === "finance"),
      today,
    ),
  }

  res.status(200).json({
    success: true,
    data: {
      totalObjectifs,
      objectifsEnCours,
      completesAujourdhui,
      totalObjectifsAujourdhui,
      tauxCompletionGlobal,
      categoriesStats,
    },
  })
})

// @desc    Ajouter ou mettre à jour un commentaire pour un objectif
// @route   PATCH /api/objectifs/:id/commentaire
// @access  Privé
exports.updateCommentaire = asyncHandler(async (req, res) => {
  const { date, commentaire } = req.body

  if (!date || commentaire === undefined) {
    return res.status(400).json({
      success: false,
      error: "Veuillez fournir une date et un commentaire",
    })
  }

  let objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à modifier cet objectif",
    })
  }

  // Mettre à jour les commentaires
  const commentaires = { ...objectif.commentaires }
  commentaires[date] = commentaire

  objectif = await prisma.objectif.update({
    where: {
      id: req.params.id,
    },
    data: {
      commentaires,
    },
  })

  res.status(200).json({
    success: true,
    data: objectif,
  })
})
// Fonction utilitaire pour calculer les statistiques par catégorie
const calculateCategoryStats = (objectifs, today) => {
  const totalObjectifs = objectifs.length
  const objectifsEnCours = objectifs.filter((obj) => obj.statut === "en_cours").length

  let completesAujourdhui = 0
  let totalObjectifsAujourdhui = 0

  objectifs.forEach((obj) => {
    if (obj.statut === "en_cours") {
      // Vérifier si l'objectif est actif aujourd'hui
      const dateDebut = new Date(obj.dateDebut || obj.createdAt)
      const dateFin = new Date(dateDebut)
      dateFin.setDate(dateFin.getDate() + (obj.duree || 90))
      const currentDate = new Date(today)

      if (currentDate >= dateDebut && currentDate <= dateFin) {
        totalObjectifsAujourdhui++

        if (obj.progression[today] !== undefined) {
          if (obj.typeDeTracking === "binaire") {
            if (obj.progression[today] === true) {
              completesAujourdhui++
            }
          } else if (obj.progression[today] > 0) {
            completesAujourdhui++
          }
        }
      }
    }
  })

  let totalJoursTrackes = 0
  let totalJoursCompletes = 0

  objectifs.forEach((obj) => {
    Object.entries(obj.progression).forEach(([date, value]) => {
      // Vérifier si l'objectif était actif à cette date
      const dateDebut = new Date(obj.dateDebut || obj.createdAt)
      const dateFin = new Date(dateDebut)
      dateFin.setDate(dateFin.getDate() + (obj.duree || 90))
      const currentDate = new Date(date)

      if (currentDate >= dateDebut && currentDate <= dateFin) {
        totalJoursTrackes++

        if (obj.typeDeTracking === "binaire") {
          if (value === true) {
            totalJoursCompletes++
          }
        } else if (value > 0) {
          totalJoursCompletes++
        }
      }
    })
  })

  const tauxCompletionGlobal = totalJoursTrackes > 0 ? (totalJoursCompletes / totalJoursTrackes) * 100 : 0

  return {
    totalObjectifs,
    objectifsEnCours,
    completesAujourdhui,
    totalObjectifsAujourdhui,
    tauxCompletionGlobal,
  }
}



// @desc    Créer un nouvel objectif
// @route   POST /api/objectifs
// @access  Privé
exports.createObjectif = asyncHandler(async (req, res) => {
  // Ajouter l'ID de l'utilisateur à l'objectif
  req.body.utilisateurId = req.utilisateur.id

  // Initialiser la durée par défaut si non spécifiée
  if (!req.body.duree) {
    req.body.duree = 90 // 3 mois par défaut
  }

  // Initialiser la date de début si non spécifiée
  if (!req.body.dateDebut) {
    req.body.dateDebut = new Date().toISOString().split("T")[0]
  }

  // Initialiser la progression à false pour aujourd'hui
  const today = new Date().toISOString().split("T")[0]
  const progression = {}

  if (req.body.typeDeTracking === "binaire") {
    progression[today] = false
  }

  // Créer l'objectif
  const objectif = await prisma.objectif.create({
    data: {
      nom: req.body.nom,
      categorie: req.body.categorie,
      typeDeTracking: req.body.typeDeTracking,
      frequence: req.body.frequence,
      cible: req.body.cible || null,
      description: req.body.description || null,
      statut: req.body.statut || "en_cours",
      progression: progression,
      commentaires: req.body.commentaires || {},
      duree: req.body.duree,
      dateDebut: req.body.dateDebut,
      utilisateurId: req.body.utilisateurId,
    },
  })

  res.status(201).json({
    success: true,
    data: objectif,
  })
})

// @desc    Mettre à jour la progression d'un objectif
// @route   PATCH /api/objectifs/:id/progression
// @access  Privé
exports.updateProgression = asyncHandler(async (req, res) => {
  const { date, valeur } = req.body

  if (!date || valeur === undefined) {
    return res.status(400).json({
      success: false,
      error: "Veuillez fournir une date et une valeur",
    })
  }

  let objectif = await prisma.objectif.findUnique({
    where: {
      id: req.params.id,
    },
  })

  if (!objectif) {
    return res.status(404).json({
      success: false,
      error: "Objectif non trouvé",
    })
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (objectif.utilisateurId !== req.utilisateur.id) {
    return res.status(401).json({
      success: false,
      error: "Non autorisé à modifier cet objectif",
    })
  }

  // Mettre à jour la progression
  const progression = { ...objectif.progression }
  progression[date] = valeur

  objectif = await prisma.objectif.update({
    where: {
      id: req.params.id,
    },
    data: {
      progression,
    },
  })

  res.status(200).json({
    success: true,
    data: objectif,
  })
})

// @desc    Mettre à jour les progressions manquantes
// @route   POST /api/objectifs/update-missing-progressions
// @access  Privé
exports.updateMissingProgressions = asyncHandler(async (req, res) => {
  const objectifs = await prisma.objectif.findMany({
    where: {
      utilisateurId: req.utilisateur.id,
      statut: "en_cours",
      typeDeTracking: "binaire",
    },
  })

  const today = new Date().toISOString().split("T")[0]
  let updatedCount = 0

  await Promise.all(
    objectifs.map(async (obj) => {
      let updated = false
      const progression = { ...obj.progression }

      const dateDebut = new Date(obj.dateDebut || obj.createdAt)
      const currentDate = new Date()

      // Parcourir tous les jours depuis le début jusqu'à hier
      for (let d = new Date(dateDebut); d < currentDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0]

        // Si la date est aujourd'hui, ne pas la traiter
        if (dateStr === today) continue

        // Si la progression n'existe pas pour cette date, la définir à false
        if (progression[dateStr] === undefined) {
          progression[dateStr] = false
          updated = true
        }
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

  res.status(200).json({
    success: true,
    message: `${updatedCount} objectifs ont été mis à jour avec les progressions manquantes.`,
  })
})
