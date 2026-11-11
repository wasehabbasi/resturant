const { Product, Category } = require("../models");
const fs = require("fs");
const path = require("path");

// Get products of logged-in restaurant
const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { restaurantId: req.restaurantId },
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, products });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// Add product to logged-in restaurant
const addProduct = async (req, res) => {
  try {
    const { name, description, price, categoryId } = req.body;

    if (!name?.trim() || price === undefined || price === "" || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid non-negative price",
      });
    }

    const category = await Category.findOne({
      where: {
        id: categoryId,
        restaurantId: req.restaurantId,
        isActive: true,
      },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Select an active category from your restaurant",
      });
    }

    const product = await Product.create({
      restaurantId: req.restaurantId,
      categoryId: category.id,
      name: name.trim(),
      description,
      price: numericPrice,
      image: req.file ? `/uploads/products/${req.file.filename}` : null,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// Update product belonging to logged-in restaurant
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { name, description, price, categoryId, isAvailable } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name cannot be empty",
      });
    }

    if (price !== undefined) {
      const numericPrice = Number(price);

      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid non-negative price",
        });
      }
    }

    if (categoryId !== undefined) {
      const category = await Category.findOne({
        where: {
          id: categoryId,
          restaurantId: req.restaurantId,
          isActive: true,
        },
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Select an active category from your restaurant",
        });
      }
    }

    const oldImage = product.image;

    await product.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(categoryId !== undefined && { categoryId }),
      ...(isAvailable !== undefined && {
        isAvailable: isAvailable === true || isAvailable === "true",
      }),
      ...(req.file && {
        image: `/uploads/products/${req.file.filename}`,
      }),
    });

    // Delete old image after successful database update
    if (req.file && oldImage) {
      const oldFilename = path.basename(oldImage);

      const oldImagePath = path.join(
        __dirname,
        "../uploads/products",
        oldFilename
      );

      try {
        await fs.promises.unlink(oldImagePath);
        console.log("Old product image deleted:", oldFilename);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Old image deletion failed:", error);
        }
      }
    }

    return res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// Delete product belonging to logged-in restaurant
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.destroy();

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Product is used in existing orders and cannot be deleted",
      });
    }

    console.error("DELETE PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};