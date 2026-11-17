
const express = require("express");
const router = express.Router();

const { getCustomers } = require("../controllers/customerController");

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

router.get("/", getCustomers);

module.exports = router;
