const express = require("express")
const { exportPdf, exportExcel, generateTemplate } = require("../controllers/export.controller")
const { protect } = require("../middleware/auth")
const { tokenFromUrl } = require("../middleware/tokenFromUrl")

const router = express.Router()

// Utiliser le middleware tokenFromUrl pour permettre l'authentification via URL
router.get("/pdf", [tokenFromUrl, protect], exportPdf)
router.get("/excel", [tokenFromUrl, protect], exportExcel)
router.get("/template", [tokenFromUrl, protect], generateTemplate)

module.exports = router
