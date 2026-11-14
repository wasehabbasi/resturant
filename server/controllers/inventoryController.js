const {
  InventoryItem,
  BranchInventory,
  StockMovement,
} = require("../models");
const { sequelize } = require("../config/database");

// Get inventory items for selected branch
const getInventory = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: {
        restaurantId: req.restaurantId,
        isActive: true,
      },
      include: [
        {
          model: BranchInventory,
          where: { branchId: req.branchId },
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    const result = items.map((item) => {
      const data = item.toJSON();
      const stock = data.BranchInventories?.[0] || null;
      const quantity = Number(stock?.quantity || 0);
      const threshold = Number(stock?.lowStockThreshold || 0);

      return {
        ...data,
        quantity,
        lowStockThreshold: threshold,
        isLowStock: quantity <= threshold,
      };
    });

    return res.json({ success: true, items: result });
  } catch (error) {
    console.error("GET INVENTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
};

// Create inventory item
const createInventoryItem = async (req, res) => {
  try {
    const { name, unit, description, lowStockThreshold } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Inventory item name is required",
      });
    }

    const threshold = Number(lowStockThreshold ?? 0);

    if (!Number.isFinite(threshold) || threshold < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid low stock threshold",
      });
    }

    const item = await InventoryItem.create({
      restaurantId: req.restaurantId,
      name: name.trim(),
      unit: unit?.trim() || "pcs",
      description: description || null,
    });

    await BranchInventory.create({
      branchId: req.branchId,
      inventoryItemId: item.id,
      quantity: 0,
      lowStockThreshold: threshold,
    });

    return res.status(201).json({
      success: true,
      message: "Inventory item created",
      item,
    });
  } catch (error) {
    console.error("CREATE INVENTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create inventory item",
    });
  }
};

// Update stock
const updateStock = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const inventoryItemId = Number(req.params.itemId);
    const { type, quantity, note } = req.body;
    const amount = Number(quantity);

    if (!Number.isInteger(inventoryItemId) || inventoryItemId <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID",
      });
    }

    if (!["stock_in", "stock_out", "adjustment"].includes(type)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid stock movement type",
      });
    }

    if (!Number.isFinite(amount) || amount < 0 || (type !== "adjustment" && amount <= 0)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Enter a valid quantity",
      });
    }

    const item = await InventoryItem.findOne({
      where: {
        id: inventoryItemId,
        restaurantId: req.restaurantId,
        isActive: true,
      },
      transaction,
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    let stock = await BranchInventory.findOne({
      where: {
        branchId: req.branchId,
        inventoryItemId,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!stock) {
      stock = await BranchInventory.create(
        {
          branchId: req.branchId,
          inventoryItemId,
          quantity: 0,
          lowStockThreshold: 0,
        },
        { transaction }
      );
    }

    const previousQuantity = Number(stock.quantity);
    let newQuantity;

    if (type === "stock_in") {
      newQuantity = previousQuantity + amount;
    } else if (type === "stock_out") {
      newQuantity = previousQuantity - amount;
    } else {
      // Adjustment quantity is the actual counted stock.
      newQuantity = amount;
    }

    if (newQuantity < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    await stock.update({ quantity: newQuantity }, { transaction });

    const movement = await StockMovement.create(
      {
        branchId: req.branchId,
        inventoryItemId,
        userId: req.userId,
        type,
        quantity:
          type === "adjustment"
            ? Math.abs(newQuantity - previousQuantity)
            : amount,
        previousQuantity,
        newQuantity,
        note: note || null,
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: "Stock updated successfully",
      stock: {
        previousQuantity,
        newQuantity,
        movement,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("UPDATE STOCK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update stock",
    });
  }
};

// Get stock movement history
const getStockMovements = async (req, res) => {
  try {
    const movements = await StockMovement.findAll({
      where: {
        branchId: req.branchId,
      },
      include: [
        { model: InventoryItem, attributes: ["id", "name", "unit"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 100,
    });

    return res.json({ success: true, movements });
  } catch (error) {
    console.error("GET STOCK MOVEMENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stock history",
    });
  }
};

module.exports = {
  getInventory,
  createInventoryItem,
  updateStock,
  getStockMovements,
};