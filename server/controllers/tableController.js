
const { RestaurantTable } = require("../models");
const QRCode = require("qrcode");
const { randomUUID } = require("crypto");

// Customer website URL
const CUSTOMER_URL =
  process.env.CUSTOMER_URL || "http://localhost:5173";

// Get all tables
const getTables = async (req, res) => {
  try {
    const tables = await RestaurantTable.findAll({
      order: [["id", "DESC"]],
    });

    const result = tables.map((table) => ({
      ...table.toJSON(),
      menuUrl: `${CUSTOMER_URL}/menu/${table.qrToken}`,
    }));

    res.json({
      success: true,
      tables: result,
    });
  } catch (error) {
    console.error("GET TABLES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tables",
    });
  }
};

// Add table
const addTable = async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber || !tableNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Table number is required",
      });
    }

    const parsedCapacity = Number(capacity || 4);

    if (
      !Number.isInteger(parsedCapacity) ||
      parsedCapacity < 1 ||
      parsedCapacity > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be between 1 and 50",
      });
    }

    const existing = await RestaurantTable.findOne({
      where: { tableNumber: tableNumber.trim() },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Table number already exists",
      });
    }

    const table = await RestaurantTable.create({
      tableNumber: tableNumber.trim(),
      capacity: parsedCapacity,
      qrToken: randomUUID(),
    });

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      table,
    });
  } catch (error) {
    console.error("ADD TABLE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create table",
    });
  }
};

// Update table
const updateTable = async (req, res) => {
  try {
    const table = await RestaurantTable.findByPk(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    const { tableNumber, capacity, isActive } = req.body;

    const updates = {};

    if (tableNumber !== undefined) {
      if (!tableNumber.trim()) {
        return res.status(400).json({
          success: false,
          message: "Table number cannot be empty",
        });
      }

      const duplicate = await RestaurantTable.findOne({
        where: { tableNumber: tableNumber.trim() },
      });

      if (duplicate && duplicate.id !== table.id) {
        return res.status(409).json({
          success: false,
          message: "Table number already exists",
        });
      }

      updates.tableNumber = tableNumber.trim();
    }

    if (capacity !== undefined) {
      const parsedCapacity = Number(capacity);

      if (
        !Number.isInteger(parsedCapacity) ||
        parsedCapacity < 1 ||
        parsedCapacity > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid table capacity",
        });
      }

      updates.capacity = parsedCapacity;
    }

    if (isActive !== undefined) {
      updates.isActive = isActive === true || isActive === "true";
    }

    await table.update(updates);

    res.json({
      success: true,
      message: "Table updated successfully",
      table,
    });
  } catch (error) {
    console.error("UPDATE TABLE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update table",
    });
  }
};

// Delete table
const deleteTable = async (req, res) => {
  try {
    const table = await RestaurantTable.findByPk(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    // Disable instead of deleting to preserve table history.
    await table.update({ isActive: false });

    res.json({
      success: true,
      message: "Table deactivated successfully",
    });
  } catch (error) {
    console.error("DELETE TABLE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to deactivate table",
    });
  }
};

// Generate QR code
const generateQR = async (req, res) => {
  try {
    const table = await RestaurantTable.findByPk(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    const menuUrl =
      `${CUSTOMER_URL}/menu/${table.qrToken}`;

    const qrCode = await QRCode.toDataURL(menuUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    res.json({
      success: true,
      qrCode,
      menuUrl,
    });
  } catch (error) {
    console.error("QR ERROR:", error);

    res.status(500).json({
      success: false,
      message: "QR generation failed",
    });
  }
};

// Public table validation
const getPublicTable = async (req, res) => {
  try {
    const table = await RestaurantTable.findOne({
      where: {
        qrToken: req.params.token,
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

    res.json({
      success: true,
      table,
    });
  } catch (error) {
    console.error("PUBLIC TABLE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify table",
    });
  }
};

module.exports = {
  getTables,
  addTable,
  updateTable,
  deleteTable,
  generateQR,
  getPublicTable,
};
