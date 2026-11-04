
const { Op } = require("sequelize");

const {
    Order,
    OrderItem,
    Product,
    RestaurantTable,
} = require("../models");

// Get all restaurant orders for manager dashboard
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
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
            error: error.message,
        });
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "accepted",
            "preparing",
            "ready",
            "completed",
            "cancelled",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status",
            });
        }

        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        await order.update({ status });

        return res.json({
            success: true,
            message: "Order status updated successfully",
            order,
        });

    } catch (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update order status",
            error: error.message,
        });
    }
};

module.exports = {
    getAllOrders,
    updateOrderStatus,
};
