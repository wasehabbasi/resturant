
const {
  Product,
  ProductIngredient,
  InventoryItem,
} = require("../models");

const { sequelize } = require("../config/database");

// Get ingredients linked to a product
const getProductIngredients = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.productId,
        restaurantId: req.restaurantId,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const ingredients = await ProductIngredient.findAll({
      where: { productId: product.id },
      include: [
        {
          model: InventoryItem,
          attributes: ["id", "name", "unit"],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.json({
      success: true,
      ingredients,
    });
  } catch (error) {
    console.error("GET PRODUCT INGREDIENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product ingredients",
    });
  }
};

// Replace ingredients for a product
const saveProductIngredients = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const productId = Number(req.params.productId);
    const { ingredients } = req.body;

    if (!Number.isInteger(productId) || productId <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!Array.isArray(ingredients)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Ingredients must be an array",
      });
    }

    const product = await Product.findOne({
      where: {
        id: productId,
        restaurantId: req.restaurantId,
      },
      transaction,
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const normalized = ingredients.map((ingredient) => ({
      inventoryItemId: Number(ingredient.inventoryItemId),
      quantityPerProduct: Number(ingredient.quantityPerProduct),
    }));

    const ids = normalized.map((item) => item.inventoryItemId);

    if (
      normalized.some(
        (item) =>
          !Number.isInteger(item.inventoryItemId) ||
          item.inventoryItemId <= 0 ||
          !Number.isFinite(item.quantityPerProduct) ||
          item.quantityPerProduct <= 0
      )
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Enter valid inventory items and quantities",
      });
    }

    if (new Set(ids).size !== ids.length) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "An ingredient cannot be added more than once",
      });
    }

    if (ids.length > 0) {
      const validItems = await InventoryItem.findAll({
        where: {
          id: ids,
          restaurantId: req.restaurantId,
          isActive: true,
        },
        transaction,
      });

      if (validItems.length !== ids.length) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "One or more inventory items are invalid",
        });
      }
    }

    await ProductIngredient.destroy({
      where: { productId: product.id },
      transaction,
    });

    if (normalized.length > 0) {
      await ProductIngredient.bulkCreate(
        normalized.map((item) => ({
          productId: product.id,
          inventoryItemId: item.inventoryItemId,
          quantityPerProduct: item.quantityPerProduct,
        })),
        { transaction }
      );
    }

    await transaction.commit();

    const savedIngredients = await ProductIngredient.findAll({
      where: { productId: product.id },
      include: [
        {
          model: InventoryItem,
          attributes: ["id", "name", "unit"],
        },
      ],
    });

    return res.json({
      success: true,
      message: "Product ingredients saved successfully",
      ingredients: savedIngredients,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("SAVE PRODUCT INGREDIENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save product ingredients",
    });
  }
};

module.exports = {
  getProductIngredients,
  saveProductIngredients,
};
