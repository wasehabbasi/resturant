
const express = require("express");
const router = express.Router();

const {
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  protect,
  authorize,
  requireRestaurant,
  requireBranch,
} = require("../middleware/authMiddleware");

// All order routes require authentication and manager/admin access
router.use(
  protect,
  authorize("manager", "admin"),
  requireRestaurant,
  requireBranch
);

// Get orders for selected branch
router.get("/", getAllOrders);

// Update order status
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
