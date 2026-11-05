const express = require("express");
const router = express.Router();

const {
  getPublicMenu,
} = require("../controllers/menuController");

const {
    placeSharedOrder,
    getSharedOrders,
    getMyOrders,
} = require("../controllers/sharedOrderController");

// Get all shared orders for a table
router.get("/:token/orders", getSharedOrders);

// Place a new order
router.post("/:token/orders", placeSharedOrder);

// Get restaurant menu
router.get("/:token", getPublicMenu);

router.get("/:token/my-orders", getMyOrders);

module.exports = router;
