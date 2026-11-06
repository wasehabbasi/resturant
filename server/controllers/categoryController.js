const { Category, Product } = require("../models");

// Get categories of logged-in restaurant
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { restaurantId: req.restaurantId },
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, categories });
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// Add category
const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await Category.create({
      restaurantId: req.restaurantId,
      name: name.trim(),
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("ADD CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const { name, description, isActive } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name cannot be empty",
      });
    }

    await category.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && {
        isActive: isActive === true || isActive === "true",
      }),
    });

    return res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const productCount = await Product.count({
      where: {
        categoryId: category.id,
        restaurantId: req.restaurantId,
      },
    });

    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Category contains products. Move or delete them first.",
      });
    }

    await category.destroy();

    return res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};

module.exports = {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
};