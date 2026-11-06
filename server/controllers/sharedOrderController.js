
const { Op } = require("sequelize");

const {
    RestaurantTable,
    Order,
    OrderItem,
    Product,
    Branch,
} = require("../models");

const { sequelize } = require("../config/database");

const {
    createBranchNotification,
} = require("../services/notificationService");

// Place a customer's order for a QR table
const placeSharedOrder = async (req, res) => {
    let transaction;

    try {
        transaction = await sequelize.transaction();
        const { token } = req.params;
        const { customerName, guestId, items } = req.body;

        if (
            !customerName ||
            customerName.trim().length < 2 ||
            customerName.trim().length > 60
        ) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Please enter a valid customer name",
            });
        }

        if (
            !guestId ||
            typeof guestId !== "string" ||
            guestId.length > 64
        ) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Invalid customer session",
            });
        }

        if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Your cart is empty or invalid",
            });
        }

        const table = await RestaurantTable.findOne({
            where: {
                qrToken: token,
                isActive: true,
            },
            transaction,
        });

        if (!table) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Invalid or inactive table",
            });
        }

        const branch = await Branch.findOne({
            where: {
                id: table.branchId,
                isActive: true,
            },
            transaction,
        });

        if (!branch) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "This restaurant branch is inactive",
            });
        }

        // Validate product IDs and quantities
        const quantities = new Map();

        for (const item of items) {
            const productId = Number(item.productId);
            const quantity = Number(item.quantity);

            if (
                !Number.isInteger(productId) ||
                productId <= 0 ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > 50
            ) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Invalid product or quantity",
                });
            }

            quantities.set(
                productId,
                (quantities.get(productId) || 0) + quantity
            );
        }

        const productIds = [...quantities.keys()];

        const products = await Product.findAll({
            where: {
                id: { [Op.in]: productIds },
                isAvailable: true,
            },
            transaction,
        });

        if (products.length !== productIds.length) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "One or more products are unavailable",
            });
        }

        // Always calculate prices from the database
        const orderItems = products.map((product) => {
            const quantity = quantities.get(product.id);
            const price = Number(product.price);

            return {
                productId: product.id,
                quantity,
                price,
                subtotal: price * quantity,
            };
        });

        const totalAmount = orderItems.reduce(
            (sum, item) => sum + item.subtotal,
            0
        );

        const orderNumber =
            "ORD-" +
            Date.now() +
            "-" +
            Math.random().toString(36).slice(2, 7).toUpperCase();

        const order = await Order.create(
            {
                orderNumber,
                restaurantId: branch.restaurantId,
                branchId: branch.id,
                tableId: table.id,
                customerName: customerName.trim(),
                guestId,
                totalAmount,
                status: "pending",
            },
            { transaction }
        );

        await OrderItem.bulkCreate(
            orderItems.map((item) => ({
                ...item,
                orderId: order.id,
            })),
            { transaction }
        );

        await transaction.commit();

        try {
            const io = req.app.get("io");

            await createBranchNotification({
                io,
                restaurantId: branch.restaurantId,
                branchId: branch.id,
                type: "new_order",
                title: "New Order Received",
                message: `New order ${order.orderNumber} received from ${customerName.trim()}`,
                data: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    tableId: table.id,
                    tableNumber: table.tableNumber,
                    totalAmount: order.totalAmount,
                },
            });
        } catch (notificationError) {
            // Order is already committed. Notification failure
            // must not make the customer order appear unsuccessful.
            console.error("NEW ORDER NOTIFICATION ERROR:", notificationError);
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                totalAmount: order.totalAmount,
                status: order.status,
            },
        });

    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }

        console.error("PLACE SHARED ORDER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
            error: error.name,
        });
    }
};


// Get all active orders for the same table
const getSharedOrders = async (req, res) => {
    try {
        const { token } = req.params;

        const table = await RestaurantTable.findOne({
            where: {
                qrToken: token,
                isActive: true,
            },
        });

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Invalid or inactive table",
            });
        }

        const orders = await Order.findAll({
            where: {
                tableId: table.id,
                status: {
                    [Op.notIn]: ["completed", "cancelled"],
                },
            },
            include: [
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
            order: [["createdAt", "ASC"]],
        });

        const combinedTotal = orders.reduce(
            (sum, order) => sum + Number(order.totalAmount),
            0
        );

        return res.json({
            success: true,
            table: {
                id: table.id,
                tableNumber: table.tableNumber,
            },
            orders,
            combinedTotal,
        });

    } catch (error) {
        console.error("GET SHARED ORDERS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch shared orders",
        });
    }
};


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

// Get orders belonging to the current customer session
const getMyOrders = async (req, res) => {
    try {
        const { token } = req.params;
        const { guestId } = req.query;

        if (
            !guestId ||
            typeof guestId !== "string" ||
            guestId.length > 64
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid customer session is required",
            });
        }

        const table = await RestaurantTable.findOne({
            where: {
                qrToken: token,
                isActive: true,
            },
        });

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Invalid or inactive table",
            });
        }

        const orders = await Order.findAll({
            where: {
                tableId: table.id,
                guestId,
            },
            include: [
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
        console.error("CUSTOMER ORDER HISTORY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your orders",
        });
    }
};


module.exports = {
    placeSharedOrder,
    getSharedOrders,
    getAllOrders,
    updateOrderStatus,
    getMyOrders,
};
