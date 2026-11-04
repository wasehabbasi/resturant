
// // const express = require("express");
// // const router = express.Router();

// // const {
// //   getPublicMenu,
// // } = require("../controllers/menuController");

// // router.get("/:token", getPublicMenu);

// // module.exports = router;




// const express = require("express");
// const router = express.Router();

// const {
//   getPublicMenu,
// } = require("../controllers/menuController");

// const {
//   placeSharedOrder,
//   getSharedOrders,
// } = require("../controllers/sharedOrderController");

// // Shared table orders
// router.get("/:token/orders", getSharedOrders);
// router.post("/:token/orders", placeSharedOrder);

// // Public restaurant menu
// router.get("/:token", getPublicMenu);

// module.exports = router;





const express = require("express");
const router = express.Router();

const {
  getPublicMenu,
} = require("../controllers/menuController");

const {
  placeSharedOrder,
  getSharedOrders,
} = require("../controllers/sharedOrderController");

// Get all shared orders for a table
router.get("/:token/orders", getSharedOrders);

// Place a new order
router.post("/:token/orders", placeSharedOrder);

// Get restaurant menu
router.get("/:token", getPublicMenu);

module.exports = router;
