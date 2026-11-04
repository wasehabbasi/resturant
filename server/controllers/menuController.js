
const {
  RestaurantTable,
  Category,
  Product,
} = require("../models");

const getPublicMenu = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify table QR token
    const table = await RestaurantTable.findOne({
      where: {
        qrToken: token,
        isActive: true,
      },
      attributes: ["id", "tableNumber", "capacity"],
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive table QR code",
      });
    }

    // Fetch active categories
    const categories = await Category.findAll({
      where: {
        isActive: true,
      },
      attributes: ["id", "name", "description"],
      order: [["id", "ASC"]],
    });

    // Fetch available products
    const products = await Product.findAll({
      where: {
        isAvailable: true,
      },
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
          where: {
            isActive: true,
          },
        },
      ],
      order: [["id", "DESC"]],
    });

    res.json({
      success: true,
      table,
      categories,
      products,
    });

  } catch (error) {
    console.error("PUBLIC MENU ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load restaurant menu",
    });
  }
};

module.exports = {
  getPublicMenu,
};
