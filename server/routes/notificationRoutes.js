const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} = require("../controllers/notificationController");

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

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

module.exports = router;