const express = require("express");
const router = express.Router();

const { recordCashPayment, getOrderPaymentSummary, } = require("../controllers/paymentController");

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

router.post("/:orderId/cash", recordCashPayment);

router.get("/:orderId", getOrderPaymentSummary);

module.exports = router;