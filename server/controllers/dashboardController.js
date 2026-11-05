const { Op } = require("sequelize");

const {
    Order,
    OrderItem,
    Product,
    RestaurantTable,
} = require("../models");

const getDashboardStats = async (req, res) => {
    try {
        const [
            totalOrders,
            totalRevenue,
            totalProducts,
            totalCustomers,
            recentOrders,
        ] = await Promise.all([
            Order.count(),

            Order.sum("totalAmount", {
                where: { status: "completed" },
            }),

            Product.count(),

            Order.count({
                distinct: true,
                col: "guestId",
                where: {
                    guestId: { [Op.ne]: null },
                },
            }),

            Order.findAll({
                limit: 5,
                order: [["createdAt", "DESC"]],
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
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                ],
            }),
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalOrders,
                totalRevenue: Number(totalRevenue || 0),
                totalProducts,
                totalCustomers,
            },
            recentOrders,
        });
    } catch (error) {
        console.error("DASHBOARD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch dashboard data",
        });
    }
};

module.exports = { getDashboardStats };