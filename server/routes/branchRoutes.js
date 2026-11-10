
const express = require("express");
const router = express.Router();

const {
  getBranches,
  createBranch,
  updateBranch,
  setDefaultBranch,
  updateBranchStatus,
} = require("../controllers/branchController");

const {
  protect,
  authorize,
  requireRestaurant,
} = require("../middleware/authMiddleware");

router.use(
  protect,
  authorize("manager", "admin"),
  requireRestaurant
);

router.get("/", getBranches);
router.post("/", createBranch);
router.put("/:id", updateBranch);
router.patch("/:id/default", setDefaultBranch);
router.patch("/:id/status", updateBranchStatus);

module.exports = router;
