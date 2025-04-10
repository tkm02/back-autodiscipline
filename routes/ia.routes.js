const express = require("express")
const {
  getConversations,
  getConversation,
  createConversation,
  addMessage,
  deleteConversation,
  getSuggestions,
  getActualites,
} = require("../controllers/ia.controller")
const { protect } = require("../middleware/auth")

const router = express.Router()

// Routes pour /api/conversations
router.route("/").get(protect, getConversations).post(protect, createConversation)
router.route("/:id").get(protect, getConversation).delete(protect, deleteConversation)
router.route("/:id/messages").post(protect, addMessage)

// Routes pour /api/objectifs/:objectifId/suggestions
router.route("/objectifs/:objectifId/suggestions").get(protect, getSuggestions)

// Routes pour /api/objectifs/:objectifId/actualites
router.route("/objectifs/:objectifId/actualites").get(protect, getActualites)

module.exports = router

