const express = require("express")
const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
} = require("../controllers/culture.controller")
const { protect } = require("../middleware/auth")

const router = express.Router()

// Routes pour /api/culture
router.route("/").get(getArticles).post(protect, createArticle)
router.route("/:id").get(getArticle).put(protect, updateArticle).delete(protect, deleteArticle)

module.exports = router

