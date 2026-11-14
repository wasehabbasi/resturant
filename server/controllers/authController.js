
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize } = require("../config/database");
const { User, Restaurant, Branch } = require("../models");


// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

// Generate a URL-friendly restaurant slug
const createSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 170);
};

// Restaurant Registration
const signup = async (req, res) => {
  try {
    const {
      restaurantName,
      restaurantSlug,
      logo,
      portalTheme,
      customerTheme,
      branchName,
      address,
      city,
      phone,
      ownerName,
      email,
      password,
    } = req.body;

    // Required fields
    if (
      !restaurantName ||
      !branchName ||
      !ownerName ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Restaurant name, branch name, owner name, email and password are required",
      });
    }

    // Normalize values
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRestaurantName = String(restaurantName).trim();
    const normalizedBranchName = String(branchName).trim();
    const normalizedOwnerName = String(ownerName).trim();

    if (
      !normalizedRestaurantName ||
      !normalizedBranchName ||
      !normalizedOwnerName
    ) {
      return res.status(400).json({
        success: false,
        message: "Names cannot be empty",
      });
    }

    if (normalizedRestaurantName.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Restaurant name cannot exceed 150 characters",
      });
    }

    if (normalizedBranchName.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Branch name cannot exceed 150 characters",
      });
    }

    if (normalizedOwnerName.length > 25) {
      return res.status(400).json({
        success: false,
        message: "Owner name cannot exceed 25 characters",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Validate optional theme values
    const validTheme = (theme) =>
      theme === undefined ||
      theme === null ||
      (typeof theme === "object" && !Array.isArray(theme));

    if (!validTheme(portalTheme) || !validTheme(customerTheme)) {
      return res.status(400).json({
        success: false,
        message: "Theme settings must be valid objects",
      });
    }

    const slug = createSlug(
      restaurantSlug || normalizedRestaurantName
    );

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid restaurant name or slug",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create all records atomically
    const result = await sequelize.transaction(async (transaction) => {
      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
        transaction,
      });

      if (existingUser) {
        const error = new Error("EMAIL_ALREADY_REGISTERED");
        error.code = "EMAIL_ALREADY_REGISTERED";
        throw error;
      }

      const existingRestaurant = await Restaurant.findOne({
        where: { slug },
        transaction,
      });

      if (existingRestaurant) {
        const error = new Error("RESTAURANT_SLUG_ALREADY_EXISTS");
        error.code = "RESTAURANT_SLUG_ALREADY_EXISTS";
        throw error;
      }

      const restaurant = await Restaurant.create(
        {
          name: normalizedRestaurantName,
          slug,
          logo: logo || null,
          portalTheme: portalTheme || {},
          customerTheme: customerTheme || {},
          status: "active",
        },
        { transaction }
      );

      const branch = await Branch.create(
        {
          restaurantId: restaurant.id,
          name: normalizedBranchName,
          address: address || null,
          city: city || null,
          phone: phone || null,
          isDefault: true,
          isActive: true,
        },
        { transaction }
      );

      const user = await User.create(
        {
          restaurantId: restaurant.id,
          name: normalizedOwnerName,
          email: normalizedEmail,
          password: hashedPassword,
          role: "manager",
          isActive: true,
        },
        { transaction }
      );

      return { restaurant, branch, user };
    });

    const token = generateToken(result.user);

    return res.status(201).json({
      success: true,
      message: "Restaurant registered successfully",
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        restaurantId: result.restaurant.id,
        branchId: result.branch.id,
      },
      restaurant: {
        id: result.restaurant.id,
        name: result.restaurant.name,
        slug: result.restaurant.slug,
        logo: result.restaurant.logo,
        portalTheme: result.restaurant.portalTheme,
        customerTheme: result.restaurant.customerTheme,
      },
      branch: {
        id: result.branch.id,
        name: result.branch.name,
        address: result.branch.address,
        city: result.branch.city,
        phone: result.branch.phone,
        isDefault: result.branch.isDefault,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);

    if (error.code === "EMAIL_ALREADY_REGISTERED") {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (error.code === "RESTAURANT_SLUG_ALREADY_EXISTS") {
      return res.status(409).json({
        success: false,
        message: "Restaurant URL is already taken. Please choose another slug.",
      });
    }

    // Handle database unique constraint race conditions
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Email or restaurant URL is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Restaurant registration failed",
    });
  }
};



// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      where: {
        email: String(email).trim().toLowerCase(),
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is disabled",
      });
    }

    const defaultBranch = await Branch.findOne({
      where: {
        restaurantId: user.restaurantId,
        isDefault: true,
        isActive: true,
      },
    });

    if (!defaultBranch) {
      return res.status(403).json({
        success: false,
        message: "No active default branch found for this restaurant",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!["manager", "admin", "cashier", "waiter", "kitchen"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access manager dashboard",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        branchId: defaultBranch.id,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// Get Logged-in Manager
const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        restaurantId: req.user.restaurantId,
      },
    });
  } catch (error) {
    console.error("Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
};
