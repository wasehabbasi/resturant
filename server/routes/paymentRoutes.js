
const express = require("express");
const router = express.Router();

const {
  recordCashPayment,
  getOrderPaymentSummary,
  getOrderReceipt,
} = require("../controllers/paymentController");

const {
  protect,
  authorize,
  requireRestaurant,
  requireBranch,
} = require("../middleware/authMiddleware");

router.use(
  protect,
  authorize("manager", "admin", "cashier"),
  requireRestaurant,
  requireBranch
);

router.post("/:orderId/cash", recordCashPayment);

router.get("/:orderId", getOrderPaymentSummary);

router.get("/:orderId/receipt", getOrderReceipt);

module.exports = router;
