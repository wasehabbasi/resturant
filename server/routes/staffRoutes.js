
const express = require("express");
const router = express.Router();

const {
  getStaff,
  createStaff,
  updateStaff,
} = require("../controllers/staffController");

const {
  protect,
  authorize,
  requireRestaurant,
} = require("../middleware/authMiddleware");

router.use(protect, authorize("manager", "admin"), requireRestaurant);

router.get("/", getStaff);
router.post("/", createStaff);
router.put("/:id", updateStaff);

module.exports = router;
