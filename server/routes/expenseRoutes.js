
const express = require("express");
const router = express.Router();

const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const {
  protect,
  authorize,
  requireRestaurant,
  requireBranch,
} = require("../middleware/authMiddleware");

router.use(
  protect,
  authorize("manager", "admin"),
  requireRestaurant,
  requireBranch
);

router.get("/", getExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
