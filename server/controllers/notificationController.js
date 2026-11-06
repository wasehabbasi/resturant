const { Op } = require("sequelize");
const { Notification } = require("../models");

const notificationScope = (req) => ({
  restaurantId: req.restaurantId,
  branchId: req.branchId,
  [Op.or]: [
    { recipientUserId: null },
    { recipientUserId: req.userId },
  ],
});

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const result = await Notification.findAndCountAll({
      where: notificationScope(req),
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      notifications: result.rows,
      total: result.count,
      page,
      totalPages: Math.ceil(result.count / limit),
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications",
    });
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        ...notificationScope(req),
        isRead: false,
      },
    });

    return res.json({ success: true, count });
  } catch (error) {
    console.error("UNREAD COUNT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch unread count",
    });
  }
};

// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: {
          ...notificationScope(req),
          isRead: false,
        },
      }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("MARK ALL READ ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update notifications",
    });
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        ...notificationScope(req),
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!notification.isRead) {
      await notification.update({ isRead: true });
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("MARK READ ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
};