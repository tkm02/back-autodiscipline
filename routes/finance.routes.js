const express = require("express")
const {
  getFinances,
  getFinance,
  createFinance,
  updateFinance,
  deleteFinance,
  getFinanceStats,
  getParametres,
  updateParametres,
} = require("../controllers/finance.controller")
const { protect } = require("../middleware/auth")

const router = express.Router()

router.route("/").get(protect, getFinances).post(protect, createFinance)
router.route("/stats").get(protect, getFinanceStats)
router.route("/parametres").get(protect, getParametres).put(protect, updateParametres)
router.route("/:id").get(protect, getFinance).put(protect, updateFinance).delete(protect, deleteFinance)

module.exports = router

