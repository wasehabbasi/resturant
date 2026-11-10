
const fs = require("fs");
const path = require("path");
const { Restaurant } = require("../models");

const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.restaurantId, {
      attributes: [
        "id",
        "name",
        "slug",
        "logo",
        "portalTheme",
        "customerTheme",
      ],
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    return res.json({ success: true, restaurant });
  } catch (error) {
    console.error("GET RESTAURANT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch restaurant settings",
    });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const { name, portalTheme, customerTheme } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 150
      ) {
        return res.status(400).json({
          success: false,
          message: "Restaurant name must be 1–150 characters",
        });
      }

      updates.name = name.trim();
    }

    const validateTheme = (theme) =>
      theme &&
      typeof theme === "object" &&
      !Array.isArray(theme);

    if (portalTheme !== undefined) {
      if (!validateTheme(portalTheme)) {
        return res.status(400).json({
          success: false,
          message: "Invalid portal theme",
        });
      }
      updates.portalTheme = portalTheme;
    }

    if (customerTheme !== undefined) {
      if (!validateTheme(customerTheme)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer theme",
        });
      }
      updates.customerTheme = customerTheme;
    }

    await restaurant.update(updates);

    return res.json({
      success: true,
      message: "Restaurant settings updated",
      restaurant,
    });
  } catch (error) {
    console.error("UPDATE RESTAURANT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update restaurant settings",
    });
  }
};

const uploadRestaurantLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a logo image",
      });
    }

    const restaurant = await Restaurant.findByPk(req.restaurantId);

    if (!restaurant) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const oldLogo = restaurant.logo;

    const logoPath = `/uploads/restaurant-logos/${req.file.filename}`;

    await restaurant.update({ logo: logoPath });

    // Delete previous locally stored logo after successful update
    if (oldLogo && oldLogo.startsWith("/uploads/restaurant-logos/")) {
      const oldPath = path.join(
        __dirname,
        "..",
        oldLogo.replace(/^\/uploads\//, "uploads/")
      );

      if (fs.existsSync(oldPath)) {
        fs.unlink(oldPath, () => {});
      }
    }

    return res.json({
      success: true,
      message: "Restaurant logo uploaded successfully",
      logo: restaurant.logo,
      restaurant,
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    console.error("LOGO UPLOAD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Logo upload failed",
    });
  }
};

const removeRestaurantLogo = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const oldLogo = restaurant.logo;

    await restaurant.update({ logo: null });

    if (oldLogo && oldLogo.startsWith("/uploads/restaurant-logos/")) {
      const oldPath = path.join(
        __dirname,
        "..",
        oldLogo.replace(/^\/uploads\//, "uploads/")
      );

      if (fs.existsSync(oldPath)) {
        fs.unlink(oldPath, () => {});
      }
    }

    return res.json({
      success: true,
      message: "Restaurant logo removed",
    });
  } catch (error) {
    console.error("REMOVE LOGO ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to remove logo",
    });
  }
};

module.exports = {
  getRestaurant,
  updateRestaurant,
  uploadRestaurantLogo,
  removeRestaurantLogo,
};
