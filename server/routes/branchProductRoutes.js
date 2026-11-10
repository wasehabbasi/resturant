
const express = require("express");
const router = express.Router();

const {
  getBranchProducts,
  updateBranchProduct,
} = require("../controllers/branchProductController");

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

router.get("/", getBranchProducts);
router.put("/:productId", updateBranchProduct);

module.exports = router;
