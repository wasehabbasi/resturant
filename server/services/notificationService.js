const { Notification } = require("../models");

const getBranchRoom = (restaurantId, branchId) => {
  return `restaurant:${restaurantId}:branch:${branchId}`;
};

const createBranchNotification = async ({
  io,
  restaurantId,
  branchId,
  type,
  title,
  message,
  data = {},
}) => {
  const notification = await Notification.create({
    restaurantId,
    branchId,
    type,
    title,
    message,
    data,
  });

  if (io) {
    io.to(getBranchRoom(restaurantId, branchId)).emit(
      "notification:new",
      notification
    );
  }

  return notification;
};

module.exports = {
  getBranchRoom,
  createBranchNotification,
};