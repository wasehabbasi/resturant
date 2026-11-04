
const { Product, Category } = require("../models");

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// Add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      categoryId,
    } = req.body;

    if (
      !name?.trim() ||
      price === undefined ||
      price === "" ||
      !categoryId
    ) {
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

    const category = await Category.findByPk(categoryId);

    if (!category || !category.isActive) {
      return res.status(400).json({
        success: false,
        message: "Select an active category",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description,
      price: numericPrice,
      categoryId,
      image: req.file
        ? `/uploads/products/${req.file.filename}`
        : null,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      name,
      description,
      price,
      categoryId,
      isAvailable,
    } = req.body;

    if (price !== undefined) {
      const numericPrice = Number(price);

      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid price",
        });
      }
    }

    if (categoryId !== undefined) {
      const category = await Category.findByPk(categoryId);

      if (!category || !category.isActive) {
        return res.status(400).json({
          success: false,
          message: "Select an active category",
        });
      }
    }

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

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.destroy();

    res.json({
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

    res.status(500).json({
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
