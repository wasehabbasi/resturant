
const express = require("express");
const router = express.Router();

const {
  getTables,
  addTable,
  updateTable,
  deleteTable,
  generateQR,
  regenerateQR,
  getPublicTable,
  getTableOrderHistory,
} = require("../controllers/tableController");

const {
  protect,
  authorize,
  requireRestaurant,
  requireBranch,
} = require("../middleware/authMiddleware");

// Public route: customer QR validation
router.get("/qr/:token", getPublicTable);

// Manager routes require authentication and selected branch
router.use(
  protect,
  authorize("manager", "admin"),
  requireRestaurant,
  requireBranch
);

router.get("/", getTables);
router.get("/:id/order-history", getTableOrderHistory);
router.post("/", addTable);
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);
router.get("/:id/qr", generateQR);
router.post("/:id/regenerate-qr", regenerateQR);

module.exports = router;
