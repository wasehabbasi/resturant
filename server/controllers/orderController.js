const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

const {
  Order,
  OrderItem,
  Product,
  RestaurantTable,
  ProductIngredient,
  BranchInventory,
  StockMovement,
} = require("../models");

const { getBranchRoom } = require("../services/notificationService");

// Get orders for the selected branch
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        branchId: req.branchId,
      },
      include: [
        {
          model: RestaurantTable,
          attributes: ["id", "tableNumber"],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "image"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};

// Allowed status transitions
const allowedTransitions = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// Update order status within selected branch only
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: {
        id,
        branchId: req.branchId,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const currentStatus = order.status;

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot change order from ${currentStatus} to ${status}`,
      });
    }

    // ACCEPT ORDER: Deduct ingredient stock
    if (status === "accepted" && !order.stockDeducted) {
      const orderItems = await OrderItem.findAll({
        where: { orderId: order.id },
        transaction,
      });

      const productIds = [
        ...new Set(orderItems.map((item) => item.productId)),
      ];

      const ingredients = await ProductIngredient.findAll({
        where: {
          productId: { [Op.in]: productIds },
        },
        transaction,
      });

      const requiredStock = {};

      for (const ingredient of ingredients) {
        const orderItem = orderItems.find(
          (item) => item.productId === ingredient.productId
        );

        if (!orderItem) continue;

        const required =
          Number(ingredient.quantityPerProduct) *
          Number(orderItem.quantity);

        requiredStock[ingredient.inventoryItemId] =
          (requiredStock[ingredient.inventoryItemId] || 0) + required;
      }

      const inventoryIds = Object.keys(requiredStock).map(Number);

      if (inventoryIds.length > 0) {
        const branchInventory = await BranchInventory.findAll({
          where: {
            branchId: req.branchId,
            inventoryItemId: { [Op.in]: inventoryIds },
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        for (const inventoryId of inventoryIds) {
          const stock = branchInventory.find(
            (item) => item.inventoryItemId === inventoryId
          );

          const required = Number(requiredStock[inventoryId].toFixed(3));

          if (!stock || Number(stock.quantity) < required) {
            const itemName = stock
              ? stock.inventoryItemId
              : inventoryId;

            throw new Error(
              `INSUFFICIENT_STOCK: Insufficient stock for inventory item ID ${itemName}`
            );
          }
        }

        for (const inventoryId of inventoryIds) {
          const stock = branchInventory.find(
            (item) => item.inventoryItemId === inventoryId
          );

          const required = Number(requiredStock[inventoryId].toFixed(3));
          const previousQuantity = Number(stock.quantity);
          const newQuantity = Number(
            (previousQuantity - required).toFixed(3)
          );

          stock.quantity = newQuantity;
          await stock.save({ transaction });

          await StockMovement.create(
            {
              branchId: req.branchId,
              inventoryItemId: inventoryId,
              userId: req.userId,
              orderId: order.id,
              type: "stock_out",
              quantity: required,
              previousQuantity,
              newQuantity,
              note: `Automatic deduction for order ${order.orderNumber}`,
            },
            { transaction }
          );
        }

        order.stockDeducted = true;
      }
    }

    // CANCEL ORDER: Restore previously deducted stock
    if (status === "cancelled" && order.stockDeducted) {
      const deductions = await StockMovement.findAll({
        where: {
          orderId: order.id,
          type: "stock_out",
        },
        transaction,
      });

      for (const movement of deductions) {
        const stock = await BranchInventory.findOne({
          where: {
            branchId: req.branchId,
            inventoryItemId: movement.inventoryItemId,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!stock) {
          throw new Error(
            `Missing branch inventory for item ${movement.inventoryItemId}`
          );
        }

        const previousQuantity = Number(stock.quantity);
        const restoredQuantity = Number(movement.quantity);
        const newQuantity = Number(
          (previousQuantity + restoredQuantity).toFixed(3)
        );

        stock.quantity = newQuantity;
        await stock.save({ transaction });

        await StockMovement.create(
          {
            branchId: req.branchId,
            inventoryItemId: movement.inventoryItemId,
            userId: req.userId,
            orderId: order.id,
            type: "stock_in",
            quantity: restoredQuantity,
            previousQuantity,
            newQuantity,
            note: `Stock restored for cancelled order ${order.orderNumber}`,
          },
          { transaction }
        );
      }
    }

    order.status = status;
    await order.save({ transaction });

    await transaction.commit();

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: RestaurantTable },
        {
          model: OrderItem,
          include: [{ model: Product }],
        },
      ],
    });

    const io = req.app.get("io");

    if (io) {
      io.to(`branch_${req.branchId}`).emit("orderUpdated", updatedOrder);

      if (updatedOrder.tableId) {
        io.to(`table_${updatedOrder.tableId}`).emit(
          "orderUpdated",
          updatedOrder
        );
      }
    }

    return res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("UPDATE ORDER STATUS ERROR:", error);

    if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
      return res.status(400).json({
        success: false,
        message: error.message.replace("INSUFFICIENT_STOCK: ", ""),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
};
