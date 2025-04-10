const express = require("express")
const {
  getRessources,
  getRessource,
  createRessource,
  updateRessource,
  deleteRessource,
} = require("../controllers/ressource.controller")
const { protect } = require("../middleware/auth")

const router = express.Router({ mergeParams: true })

// Routes pour /api/objectifs/:objectifId/ressources
router.route("/").get(protect, getRessources).post(protect, createRessource)

// Routes pour /api/ressources/:id
router.route("/:id").get(protect, getRessource).put(protect, updateRessource).delete(protect, deleteRessource)

module.exports = router

