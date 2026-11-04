
const express = require("express");

const router = express.Router();

const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

router.use(protect, authorize("manager", "admin"));

router.get("/", getCategories);

router.post("/", addCategory);

router.put("/:id", updateCategory);

router.delete("/:id", deleteCategory);

module.exports = router;
