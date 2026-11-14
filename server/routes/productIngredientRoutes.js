const express = require("express");
const router = express.Router();

const {
  getProductIngredients,
  saveProductIngredients,
} = require("../controllers/productIngredientController");

const {
  protect,
  authorize,
  requireRestaurant,
} = require("../middleware/authMiddleware");

router.use(
  protect,
  authorize("manager", "admin"),
  requireRestaurant
);

router.get("/:productId", getProductIngredients);
router.put("/:productId", saveProductIngredients);

module.exports = router;