
const express = require("express");
const router = express.Router();

const {
  getTables,
  addTable,
  updateTable,
  deleteTable,
  generateQR,
  getPublicTable,
} = require("../controllers/tableController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Public route: customer QR validation
router.get("/qr/:token", getPublicTable);

// Manager-only routes
router.use(protect, authorize("manager", "admin"));

router.get("/", getTables);
router.post("/", addTable);
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);
router.get("/:id/qr", generateQR);

module.exports = router;
