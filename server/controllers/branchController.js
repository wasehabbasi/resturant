
const { Branch } = require("../models");
const { sequelize } = require("../config/database");

// Get all branches of logged-in restaurant
const getBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      where: {
        restaurantId: req.restaurantId,
      },
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "ASC"],
      ],
    });

    return res.json({
      success: true,
      branches,
    });
  } catch (error) {
    console.error("GET BRANCHES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch branches",
    });
  }
};

// Create a new branch
const createBranch = async (req, res) => {
  try {
    const { name, address, city, phone } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Branch name is required",
      });
    }

    if (name.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: "Branch name cannot exceed 150 characters",
      });
    }

    const branch = await Branch.create({
      restaurantId: req.restaurantId,
      name: name.trim(),
      address: address?.trim() || null,
      city: city?.trim() || null,
      phone: phone?.trim() || null,
      isDefault: false,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      branch,
    });
  } catch (error) {
    console.error("CREATE BRANCH ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create branch",
    });
  }
};

// Update branch details
const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const { name, address, city, phone } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Branch name cannot be empty",
        });
      }

      if (name.trim().length > 150) {
        return res.status(400).json({
          success: false,
          message: "Branch name cannot exceed 150 characters",
        });
      }

      updates.name = name.trim();
    }

    if (address !== undefined) updates.address = address?.trim() || null;
    if (city !== undefined) updates.city = city?.trim() || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;

    await branch.update(updates);

    return res.json({
      success: true,
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    console.error("UPDATE BRANCH ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update branch",
    });
  }
};

// Set a branch as the restaurant's default branch
const setDefaultBranch = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const branch = await Branch.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
        isActive: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!branch) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Active branch not found",
      });
    }

    await Branch.update(
      { isDefault: false },
      {
        where: { restaurantId: req.restaurantId },
        transaction,
      }
    );

    await branch.update(
      { isDefault: true },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: "Default branch updated successfully",
      branch,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("SET DEFAULT BRANCH ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to set default branch",
    });
  }
};

// Activate or deactivate a branch
const updateBranchStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const branch = await Branch.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    if (!isActive && branch.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Set another branch as default before deactivating this branch",
      });
    }

    await branch.update({ isActive });

    return res.json({
      success: true,
      message: `Branch ${isActive ? "activated" : "deactivated"} successfully`,
      branch,
    });
  } catch (error) {
    console.error("UPDATE BRANCH STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update branch status",
    });
  }
};

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  setDefaultBranch,
  updateBranchStatus,
};
