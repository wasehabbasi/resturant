
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const {
  getRestaurant,
  updateRestaurant,
  uploadRestaurantLogo,
  removeRestaurantLogo,
} = require("../controllers/restaurantController");

const {
  protect,
  authorize,
  requireRestaurant,
} = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "restaurant-logos"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `restaurant-${req.restaurantId}-${Date.now()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }

    cb(null, true);
  },
});

router.use(protect, authorize("manager", "admin"), requireRestaurant);

router.get("/", getRestaurant);
router.put("/", updateRestaurant);
router.post("/logo", upload.single("logo"), uploadRestaurantLogo);
router.delete("/logo", removeRestaurantLogo);

module.exports = router;
