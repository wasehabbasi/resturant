
const { RestaurantTable } = require("../models");
const QRCode = require("qrcode");
const { randomUUID } = require("crypto");

const CUSTOMER_URL =
  process.env.CUSTOMER_URL || "http://localhost:5173";

// Get tables of selected branch only
const getTables = async (req, res) => {
  try {
    const tables = await RestaurantTable.findAll({
      where: { branchId: req.branchId },
      order: [["id", "DESC"]],
    });

    const result = tables.map((table) => ({
      ...table.toJSON(),
      menuUrl: `${CUSTOMER_URL}/menu/${table.qrToken}`,
    }));

    return res.json({ success: true, tables: result });
  } catch (error) {
    console.error("GET TABLES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tables",
    });
  }
};

// Add table to selected branch
const addTable = async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (
      typeof tableNumber !== "string" ||
      !tableNumber.trim() ||
      tableNumber.trim().length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "Table number is required (maximum 30 characters)",
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

    const normalizedNumber = tableNumber.trim();

    const existing = await RestaurantTable.findOne({
      where: {
        branchId: req.branchId,
        tableNumber: normalizedNumber,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Table number already exists in this branch",
      });
    }

    const table = await RestaurantTable.create({
      branchId: req.branchId,
      tableNumber: normalizedNumber,
      capacity: parsedCapacity,
      qrToken: randomUUID(),
    });

    return res.status(201).json({
      success: true,
      message: "Table created successfully",
      table,
    });
  } catch (error) {
    console.error("ADD TABLE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create table",
    });
  }
};

// Update table only inside selected branch
const updateTable = async (req, res) => {
  try {
    const table = await RestaurantTable.findOne({
      where: {
        id: req.params.id,
        branchId: req.branchId,
      },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found in selected branch",
      });
    }

    const { tableNumber, capacity, isActive } = req.body;
    const updates = {};

    if (tableNumber !== undefined) {
      if (
        typeof tableNumber !== "string" ||
        !tableNumber.trim() ||
        tableNumber.trim().length > 30
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid table number",
        });
      }

      const normalizedNumber = tableNumber.trim();

      const duplicate = await RestaurantTable.findOne({
        where: {
          branchId: req.branchId,
          tableNumber: normalizedNumber,
        },
      });

      if (duplicate && duplicate.id !== table.id) {
        return res.status(409).json({
          success: false,
          message: "Table number already exists in this branch",
        });
      }

      updates.tableNumber = normalizedNumber;
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
          message: "Capacity must be between 1 and 50",
        });
      }

      updates.capacity = parsedCapacity;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      updates.isActive = isActive;
    }

    await table.update(updates);

    return res.json({
      success: true,
      message: "Table updated successfully",
      table,
    });
  } catch (error) {
    console.error("UPDATE TABLE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update table",
    });
  }
};

// Deactivate table (preserve order history)
const deleteTable = async (req, res) => {
  try {
    const table = await RestaurantTable.findOne({
      where: {
        id: req.params.id,
        branchId: req.branchId,
      },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found in selected branch",
      });
    }

    await table.update({ isActive: false });

    return res.json({
      success: true,
      message: "Table deactivated successfully",
    });
  } catch (error) {
    console.error("DELETE TABLE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate table",
    });
  }
};

// Generate QR only for selected branch's table
const generateQR = async (req, res) => {
  try {
    const table = await RestaurantTable.findOne({
      where: {
        id: req.params.id,
        branchId: req.branchId,
      },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found in selected branch",
      });
    }

    const menuUrl = `${CUSTOMER_URL}/menu/${table.qrToken}`;

    const qrCode = await QRCode.toDataURL(menuUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    return res.json({
      success: true,
      qrCode,
      menuUrl,
    });
  } catch (error) {
    console.error("QR ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "QR generation failed",
    });
  }
};

// Public table validation by QR token
const getPublicTable = async (req, res) => {
  try {
    const table = await RestaurantTable.findOne({
      where: {
        qrToken: req.params.token,
        isActive: true,
      },
      attributes: ["id", "branchId", "tableNumber", "capacity"],
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive table QR code",
      });
    }

    return res.json({
      success: true,
      table,
    });
  } catch (error) {
    console.error("PUBLIC TABLE ERROR:", error);
    return res.status(500).json({
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
