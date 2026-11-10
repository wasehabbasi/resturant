
const { BranchProduct, Product } = require("../models");

// Get products with selected branch overrides
const getBranchProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { restaurantId: req.restaurantId },
      order: [["createdAt", "DESC"]],
    });

    const overrides = await BranchProduct.findAll({
      where: { branchId: req.branchId },
    });

    const overrideMap = new Map(
      overrides.map((item) => [Number(item.productId), item])
    );

    const result = products.map((product) => {
      const item = product.toJSON();
      const override = overrideMap.get(Number(item.id));

      return {
        ...item,
        basePrice: Number(item.price),
        branchPrice:
          override?.priceOverride != null
            ? Number(override.priceOverride)
            : Number(item.price),
        branchAvailability:
          override?.isAvailable != null
            ? override.isAvailable
            : item.isAvailable,
        hasPriceOverride: override?.priceOverride != null,
        hasAvailabilityOverride: override?.isAvailable != null,
      };
    });

    return res.json({ success: true, products: result });
  } catch (error) {
    console.error("GET BRANCH PRODUCTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch branch products",
    });
  }
};

// Update selected branch's product price and availability
const updateBranchProduct = async (req, res) => {
  try {
    const { priceOverride, isAvailable } = req.body;
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({
      where: {
        id: productId,
        restaurantId: req.restaurantId,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updates = {};

    if (priceOverride !== undefined) {
      if (
        priceOverride !== null &&
        (priceOverride === "" ||
          !Number.isFinite(Number(priceOverride)) ||
          Number(priceOverride) < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid non-negative price or null to reset",
        });
      }

      updates.priceOverride =
        priceOverride === null ? null : Number(priceOverride);
    }

    if (isAvailable !== undefined) {
      if (isAvailable !== null && typeof isAvailable !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Availability must be true, false or null",
        });
      }

      updates.isAvailable = isAvailable;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No branch product settings provided",
      });
    }

    const [branchProduct] = await BranchProduct.findOrCreate({
      where: {
        branchId: req.branchId,
        productId: product.id,
      },
      defaults: {
        branchId: req.branchId,
        productId: product.id,
        ...updates,
      },
    });

    if (branchProduct) {
      await branchProduct.update(updates);
    }

    return res.json({
      success: true,
      message: "Branch product settings updated",
      branchProduct,
    });
  } catch (error) {
    console.error("UPDATE BRANCH PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update branch product",
    });
  }
};

module.exports = {
  getBranchProducts,
  updateBranchProduct,
};
