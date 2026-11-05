const {
    Order,
    OrderItem,
    Product,
    RestaurantTable,
} = require("../models");

// Get all restaurant orders
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
        });
    }
};

// Valid order status transitions
const allowedTransitions = {
    pending: ["accepted", "cancelled"],
    accepted: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || typeof status !== "string") {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid order status",
            });
        }

        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const currentStatus = order.status;
        const allowedNextStatuses =
            allowedTransitions[currentStatus] || [];

        if (!allowedNextStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change order status from ${currentStatus} to ${status}`,
                currentStatus,
                allowedNextStatuses,
            });
        }

        // Prevent overwriting a status changed by another request
        const [updatedRows] = await Order.update(
            { status },
            {
                where: {
                    id: order.id,
                    status: currentStatus,
                },
            }
        );

        if (updatedRows === 0) {
            return res.status(409).json({
                success: false,
                message: "Order status has changed. Please refresh and try again.",
            });
        }

        await order.reload();

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });
    } catch (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update order status",
        });
    }
};

module.exports = {
    getAllOrders,
    updateOrderStatus,
};