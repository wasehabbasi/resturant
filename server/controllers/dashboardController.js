
const { Op } = require("sequelize");

const {
    Order,
    OrderItem,
    Product,
    RestaurantTable,
} = require("../models");

const getDashboardStats = async (req, res) => {
    try {
        const branchId = req.branchId;
        const restaurantId = req.restaurantId;

        const [
            totalOrders,
            totalRevenue,
            totalProducts,
            totalCustomers,
            recentOrders,
        ] = await Promise.all([
            Order.count({
                where: { branchId },
            }),

            Order.sum("totalAmount", {
                where: {
                    branchId,
                    status: "completed",
                },
            }),

            Product.count({
                where: { restaurantId },
            }),

            Order.count({
                distinct: true,
                col: "guestId",
                where: {
                    branchId,
                    guestId: { [Op.ne]: null },
                },
            }),

            Order.findAll({
                where: { branchId },
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
