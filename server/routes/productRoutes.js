
const express = require("express");

const router = express.Router();

const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const upload = require("../middleware/uploadMiddleware");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

router.use(protect, authorize("manager", "admin"));

router.get("/", getProducts);

router.post("/", upload.single("image"), addProduct);

router.put("/:id", upload.single("image"), updateProduct);

router.delete("/:id", deleteProduct);

module.exports = router;
