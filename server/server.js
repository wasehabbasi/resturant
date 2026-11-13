require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const { connectDB, sequelize } = require("./config/database");

const { User, Branch, RestaurantTable } = require("./models");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const tableRoutes = require("./routes/tableRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const branchRoutes = require("./routes/branchRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const branchProductRoutes = require("./routes/branchProductRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = (
  process.env.CLIENT_URLS ||
  "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Express CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-branch-id",
    ],
  })
);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Socket origin not allowed"));
    },
    methods: ["GET", "POST"],
  },
});

// Make Socket.IO available to Express controllers
app.set("io", io);

// Authenticate every socket connection

// Authenticate manager sockets and QR-table customer sockets
io.use(async (socket, next) => {
  try {
    // Customer connection through QR table token
    const tableToken = socket.handshake.auth?.tableToken;

    if (tableToken) {
      const table = await RestaurantTable.findOne({
        where: {
          qrToken: tableToken,
          isActive: true,
        },
      });

      if (!table) {
        return next(new Error("Invalid or inactive table QR"));
      }

      const branch = await Branch.findOne({
        where: {
          id: table.branchId,
          isActive: true,
        },
      });

      if (!branch) {
        return next(new Error("Restaurant branch is inactive"));
      }

      socket.data.customerTableId = table.id;
      socket.data.restaurantId = branch.restaurantId;
      socket.data.branchId = branch.id;
      socket.data.isCustomer = true;

      return next();
    }

    // Existing manager authentication
    const token = socket.handshake.auth?.token;
    const branchId = socket.handshake.auth?.branchId;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    if (!branchId || !/^\d+$/.test(String(branchId))) {
      return next(new Error("Valid branch ID is required"));
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
    socket.data.role = user.role;
    socket.data.isCustomer = false;

    next();
  } catch (error) {
    console.error("SOCKET AUTH ERROR:", error.message);
    next(new Error("Invalid or expired authentication"));
  }
});


// Join the verified branch room

io.on("connection", (socket) => {
  if (socket.data.isCustomer) {
    // Customer joins only their own QR table room
    socket.join(`table:${socket.data.customerTableId}`);

    console.log(
      `Customer socket connected: Table ${socket.data.customerTableId}`
    );
  } else {
    // Manager joins their assigned branch room
    const room = `restaurant:${socket.data.restaurantId}:branch:${socket.data.branchId}`;

    socket.join(room);

    console.log(
      `Socket connected: User ${socket.data.userId}, Branch ${socket.data.branchId}`
    );
  }

  socket.on("disconnect", () => {
    if (socket.data.isCustomer) {
      console.log(
        `Customer socket disconnected: Table ${socket.data.customerTableId}`
      );
    } else {
      console.log(`Socket disconnected: User ${socket.data.userId}`);
    }
  });
});


app.use(express.json({ limit: "5mb" }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Restaurant API is running!",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/branch-products", branchProductRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/inventory", inventoryRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error("API ERROR:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await sequelize.sync();

    console.log("Database tables synchronized.");

    const PORT = process.env.PORT || 5000;

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Socket.IO server is ready.");
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();