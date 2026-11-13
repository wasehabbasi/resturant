const bcrypt = require("bcryptjs");
const { User } = require("../models");

const STAFF_ROLES = ["cashier", "waiter", "kitchen"];

const getStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: {
        restaurantId: req.restaurantId,
        role: STAFF_ROLES,
      },
      attributes: ["id", "name", "email", "role", "isActive", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, staff });
  } catch (error) {
    console.error("GET STAFF ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch staff" });
  }
};

const createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
      });
    }

    if (name.trim().length > 25) {
      return res.status(400).json({ success: false, message: "Name cannot exceed 25 characters" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid staff role" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const staff = await User.create({
      restaurantId: req.restaurantId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Staff account created successfully",
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error("CREATE STAFF ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to create staff account" });
  }
};

const updateStaff = async (req, res) => {
  try {
    const staff = await User.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
        role: STAFF_ROLES,
      },
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    const { name, email, role, isActive, password } = req.body;

    if (name !== undefined && (!name.trim() || name.trim().length > 25)) {
      return res.status(400).json({ success: false, message: "Enter a valid name (maximum 25 characters)" });
    }

    if (role !== undefined && !STAFF_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid staff role" });
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email address" });
      }

      const duplicate = await User.findOne({
        where: { email: normalizedEmail },
      });

      if (duplicate && duplicate.id !== staff.id) {
        return res.status(409).json({ success: false, message: "Email already registered" });
      }

      staff.email = normalizedEmail;
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
      }

      staff.password = await bcrypt.hash(password, 12);
    }

    if (name !== undefined) staff.name = name.trim();
    if (role !== undefined) staff.role = role;
    if (isActive !== undefined) staff.isActive = Boolean(isActive);

    await staff.save();

    return res.json({
      success: true,
      message: "Staff updated successfully",
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update staff" });
  }
};

module.exports = { getStaff, createStaff, updateStaff };
