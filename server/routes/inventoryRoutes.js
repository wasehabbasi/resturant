const express = require("express");
const router = express.Router();

const {
  getInventory,
  createInventoryItem,
  updateStock,
  getStockMovements,
} = require("../controllers/inventoryController");

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

router.get("/", getInventory);
router.post("/", createInventoryItem);
router.patch("/:itemId/stock", updateStock);
router.get("/movements", getStockMovements);

module.exports = router;