
const express = require("express");
const router = express.Router();

const { getDashboardStats } = require("../controllers/dashboardController");

const {
    protect,
    authorize,
    requireRestaurant,
    requireBranch,
} = require("../middleware/authMiddleware");

router.get(
    "/stats",
    protect,
    authorize("manager", "admin"),
    requireRestaurant,
    requireBranch,
    getDashboardStats
);

module.exports = router;
