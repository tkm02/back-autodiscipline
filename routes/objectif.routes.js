const express = require("express")
const {
  getObjectifs,
  getObjectif,
  createObjectif,
  updateObjectif,
  updateProgression,
  deleteObjectif,
} = require("../controllers/objectif.controller")
const { protect } = require("../middleware/auth")

const router = express.Router()

router.route("/").get(protect, getObjectifs).post(protect, createObjectif)

router.route("/:id").get(protect, getObjectif).put(protect, updateObjectif).delete(protect, deleteObjectif)

router.route("/:id/progression").patch(protect, updateProgression)

module.exports = router

