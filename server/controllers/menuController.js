
const {
  RestaurantTable,
  Branch,
  BranchProduct,
  Category,
  Product,
} = require("../models");

const getPublicMenu = async (req, res) => {
  try {
    const { token } = req.params;

    // Find active table and its branch
    const table = await RestaurantTable.findOne({
      where: {
        qrToken: token,
        isActive: true,
      },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive table QR code",
      });
    }

    // Verify branch
    const branch = await Branch.findOne({
      where: {
        id: table.branchId,
        isActive: true,
      },
      attributes: ["id", "restaurantId", "name", "city"],
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Restaurant branch is unavailable",
      });
    }

    // Get active categories of this restaurant
    const categories = await Category.findAll({
      where: {
        restaurantId: branch.restaurantId,
        isActive: true,
      },
      attributes: ["id", "name", "description"],
      order: [["id", "ASC"]],
    });

    // Get restaurant's products
    const products = await Product.findAll({
      where: {
        restaurantId: branch.restaurantId,
      },
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
          where: {
            restaurantId: branch.restaurantId,
            isActive: true,
          },
        },
      ],
      order: [["id", "DESC"]],
    });

    // Get branch-specific product overrides
    const overrides = await BranchProduct.findAll({
      where: {
        branchId: branch.id,
      },
    });

    const overrideMap = new Map(
      overrides.map((item) => [
        Number(item.productId),
        item,
      ])
    );

    // Apply branch price and availability overrides
    const branchProducts = products
      .map((product) => {
        const item = product.toJSON();
        const override = overrideMap.get(Number(item.id));

        const effectivePrice =
          override?.priceOverride !== null &&
          override?.priceOverride !== undefined
            ? Number(override.priceOverride)
            : Number(item.price);

        const effectiveAvailability =
          override?.isAvailable !== null &&
          override?.isAvailable !== undefined
            ? override.isAvailable
            : item.isAvailable;

        return {
          ...item,
          basePrice: Number(item.price),
          price: effectivePrice,
          isAvailable: Boolean(effectiveAvailability),
          branchId: branch.id,
        };
      })
      .filter((product) => product.isAvailable);

    return res.json({
      success: true,
      restaurant: {
        id: branch.restaurantId,
      },
      branch: {
        id: branch.id,
        name: branch.name,
        city: branch.city,
      },
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
      },
      categories,
      products: branchProducts,
    });
  } catch (error) {
    console.error("PUBLIC MENU ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load restaurant menu",
    });
  }
};

module.exports = {
  getPublicMenu,
};
