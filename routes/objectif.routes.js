const express = require("express")
const router = express.Router()
const {
  createObjectif,
  getObjectifs,
  getObjectif,
  updateObjectif,
  deleteObjectif,
  updateProgression,
  updateMissingProgressions,
  getStatistiques,
} = require("../controllers/objectif.controller")
const { protect } = require("../middleware/auth")

router.route("/").get(protect, getObjectifs).post(protect, createObjectif)

router.route("/:id").get(protect, getObjectif).put(protect, updateObjectif).delete(protect, deleteObjectif)

router.route("/:id/progression").patch(protect, updateProgression)

router.route("/update-missing-progressions").post(protect, updateMissingProgressions)

router.route("/statistiques").get(protect, getStatistiques)

module.exports = router
