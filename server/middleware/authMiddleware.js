
const jwt = require("jsonwebtoken");
const { User, Branch } = require("../models");

// Authenticate user using JWT
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive account",
      });
    }

    // Always use restaurantId from database, not from request/token
    req.user = user;
    req.restaurantId = user.restaurantId;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
      });
    }

    next();
  };
};

// Ensure user belongs to a restaurant
const requireRestaurant = (req, res, next) => {
  if (!req.user || !req.restaurantId) {
    return res.status(403).json({
      success: false,
      message: "Restaurant access is required",
    });
  }

  next();
};

// Verify selected branch belongs to logged-in user's restaurant
// Send branch ID through the x-branch-id request header
const requireBranch = async (req, res, next) => {
  try {
    if (!req.user || !req.restaurantId) {
      return res.status(403).json({
        success: false,
        message: "Restaurant access is required",
      });
    }

    const branchId = req.headers["x-branch-id"];

    if (!branchId || !/^\d+$/.test(String(branchId))) {
      return res.status(400).json({
        success: false,
        message: "A valid x-branch-id header is required",
      });
    }

    const branch = await Branch.findOne({
      where: {
        id: Number(branchId),
        restaurantId: req.restaurantId,
        isActive: true,
      },
    });

    if (!branch) {
      return res.status(403).json({
        success: false,
        message: "Branch not found or access denied",
      });
    }

    req.branch = branch;
    req.branchId = branch.id;

    next();
  } catch (error) {
    console.error("Branch Verification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify branch access",
    });
  }
};

module.exports = {
  protect,
  authorize,
  requireRestaurant,
  requireBranch,
};
