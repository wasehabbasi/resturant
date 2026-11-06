const jwt = require("jsonwebtoken");
const { User, Branch } = require("../models");
const { getBranchRoom } = require("../services/notificationService");

const setupSocketAuth = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const branchId = socket.handshake.auth?.branchId;

      if (!token || !branchId || !/^\d+$/.test(String(branchId))) {
        return next(new Error("Authentication and branch are required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error("Invalid or inactive account"));
      }

      const branch = await Branch.findOne({
        where: {
          id: Number(branchId),
          restaurantId: user.restaurantId,
          isActive: true,
        },
      });

      if (!branch) {
        return next(new Error("Branch access denied"));
      }

      socket.data.userId = user.id;
      socket.data.restaurantId = user.restaurantId;
      socket.data.branchId = branch.id;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      next(new Error("Invalid or expired socket token"));
    }
  });

  io.on("connection", (socket) => {
    const room = getBranchRoom(
      socket.data.restaurantId,
      socket.data.branchId
    );

    socket.join(room);

    console.log(
      `Socket connected: User ${socket.data.userId}, Branch ${socket.data.branchId}`
    );

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: User ${socket.data.userId}`);
    });
  });
};

module.exports = setupSocketAuth;