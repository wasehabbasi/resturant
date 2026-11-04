require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB, sequelize } = require("./config/database");

require("./models");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const tableRoutes = require("./routes/tableRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Restaurant API is running!",
    });
});

app.use("/api/auth", authRoutes);

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/tables", tableRoutes);

app.use("/api/menu", menuRoutes);

app.use("/api/orders", orderRoutes);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

const path = require("path");

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

const startServer = async () => {
    try {
        await connectDB();

        await sequelize.sync();

        console.log("Database Tables Created Successfully!");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed!");
        process.exit(1);
    }
};

startServer();








// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const path = require("path");

// const { connectDB, sequelize } = require("./config/database");

// require("./models");

// const authRoutes = require("./routes/authRoutes");
// const categoryRoutes = require("./routes/categoryRoutes");
// const productRoutes = require("./routes/productRoutes");
// const tableRoutes = require("./routes/tableRoutes");
// const menuRoutes = require("./routes/menuRoutes");
// const orderRoutes = require("./routes/orderRoutes");

// const app = express();

// // CORS - configure only once, before routes
// app.use(cors({
//     origin: [
//         "http://localhost:5173",
//         "http://localhost:5174",
//     ],
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
// }));

// app.use(express.json({ limit: "10kb" }));

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.get("/", (req, res) => {
//     res.json({
//         success: true,
//         message: "Restaurant API is running!",
//     });
// });

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/tables", tableRoutes);
// app.use("/api/menu", menuRoutes);
// app.use("/api/orders", orderRoutes);

// const startServer = async () => {
//     try {
//         await connectDB();

//         await sequelize.sync();

//         console.log("Database connected successfully!");

//         const PORT = process.env.PORT || 5000;

//         app.listen(PORT, () => {
//             console.log(`Server running on port ${PORT}`);
//         });

//     } catch (error) {
//         console.error("Server startup failed:", error);
//         process.exit(1);
//     }
// };

// startServer();
