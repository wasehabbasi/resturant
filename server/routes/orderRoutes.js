
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

router.use(
  protect,
  requireRestaurant,
  requireBranch
);

// All staff roles can view branch orders
router.get(
  "/",
  authorize("manager", "admin", "cashier", "waiter", "kitchen"),
  getAllOrders
);

// Only manager, admin and kitchen can update order status
router.patch(
  "/:id/status",
  authorize("manager", "admin", "kitchen"),
  updateOrderStatus
);

module.exports = router;
