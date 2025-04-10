const express = require("express")
const { getSourates, getVersets, getVerset, rechercherCoran } = require("../controllers/coran.controller")

const router = express.Router()

// Routes pour /api/coran
router.route("/sourates").get(getSourates)
router.route("/sourates/:sourate").get(getVersets)
router.route("/sourates/:sourate/versets/:verset").get(getVerset)
router.route("/recherche").get(rechercherCoran)

module.exports = router

