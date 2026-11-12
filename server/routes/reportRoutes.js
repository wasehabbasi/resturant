
const express = require("express");
const router = express.Router();

const { getReports } = require("../controllers/reportController");

const {
    protect,
    authorize,
    requireRestaurant,
    requireBranch,
} = require("../middleware/authMiddleware");

router.get(
    "/",
    protect,
    authorize("manager", "admin"),
    requireRestaurant,
    requireBranch,
    getReports
);

module.exports = router;
