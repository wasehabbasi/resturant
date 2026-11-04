const express = require("express");
const router = express.Router();

const {
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

router.use(protect, authorize("manager", "admin"));

router.get("/", getAllOrders);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;