const { QueryTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const getReports = async (req, res) => {
    try {
        const [
            todayStats,
            monthlyStats,
            dailySales,
            monthlySales,
            topProducts,
            orderStatus,
        ] = await Promise.all([

            // Today's orders and completed revenue
            sequelize.query(`
                SELECT
                    COUNT(*) AS totalOrders,
                    SUM(
                        CASE WHEN status = 'completed'
                        THEN totalAmount ELSE 0 END
                    ) AS revenue
                FROM Orders
                WHERE DATE(createdAt) = CURDATE()
            `, { type: QueryTypes.SELECT }),

            // Current month's orders and completed revenue
            sequelize.query(`
                SELECT
                    COUNT(*) AS totalOrders,
                    SUM(
                        CASE WHEN status = 'completed'
                        THEN totalAmount ELSE 0 END
                    ) AS revenue
                FROM Orders
                WHERE YEAR(createdAt) = YEAR(CURDATE())
                AND MONTH(createdAt) = MONTH(CURDATE())
            `, { type: QueryTypes.SELECT }),

            // Daily sales for last 7 days
            sequelize.query(`
                SELECT
                    DATE_FORMAT(createdAt, '%Y-%m-%d') AS label,
                    COUNT(*) AS totalOrders,
                    SUM(
                        CASE WHEN status = 'completed'
                        THEN totalAmount ELSE 0 END
                    ) AS revenue
                FROM Orders
                WHERE DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                AND DATE(createdAt) <= CURDATE()
                GROUP BY DATE(createdAt)
                ORDER BY DATE(createdAt) ASC
            `, { type: QueryTypes.SELECT }),

            // Monthly sales for last 12 months
            sequelize.query(`
                SELECT
                    DATE_FORMAT(createdAt, '%Y-%m') AS label,
                    COUNT(*) AS totalOrders,
                    SUM(
                        CASE WHEN status = 'completed'
                        THEN totalAmount ELSE 0 END
                    ) AS revenue
                FROM Orders
                WHERE createdAt >= DATE_FORMAT(
                    DATE_SUB(CURDATE(), INTERVAL 11 MONTH),
                    '%Y-%m-01'
                )
                AND createdAt < DATE_ADD(LAST_DAY(CURDATE()), INTERVAL 1 DAY)
                GROUP BY YEAR(createdAt), MONTH(createdAt)
                ORDER BY YEAR(createdAt), MONTH(createdAt)
            `, { type: QueryTypes.SELECT }),

            // Top 5 products by completed-order quantity
            sequelize.query(`
                SELECT
                    p.id,
                    p.name,
                    SUM(oi.quantity) AS totalQuantity,
                    SUM(oi.subtotal) AS totalRevenue
                FROM OrderItems oi
                INNER JOIN Orders o ON o.id = oi.orderId
                INNER JOIN Products p ON p.id = oi.productId
                WHERE o.status = 'completed'
                GROUP BY p.id, p.name
                ORDER BY totalQuantity DESC
                LIMIT 5
            `, { type: QueryTypes.SELECT }),

            // Order status breakdown
            sequelize.query(`
                SELECT
                    status,
                    COUNT(*) AS total
                FROM Orders
                GROUP BY status
            `, { type: QueryTypes.SELECT }),
        ]);

        return res.status(200).json({
            success: true,
            summary: {
                today: {
                    totalOrders: Number(todayStats[0].totalOrders || 0),
                    revenue: Number(todayStats[0].revenue || 0),
                },
                thisMonth: {
                    totalOrders: Number(monthlyStats[0].totalOrders || 0),
                    revenue: Number(monthlyStats[0].revenue || 0),
                },
            },
            dailySales: dailySales.map((item) => ({
                label: item.label,
                totalOrders: Number(item.totalOrders),
                revenue: Number(item.revenue || 0),
            })),
            monthlySales: monthlySales.map((item) => ({
                label: item.label,
                totalOrders: Number(item.totalOrders),
                revenue: Number(item.revenue || 0),
            })),
            topProducts: topProducts.map((item) => ({
                id: item.id,
                name: item.name,
                totalQuantity: Number(item.totalQuantity),
                totalRevenue: Number(item.totalRevenue || 0),
            })),
            orderStatus: orderStatus.map((item) => ({
                status: item.status,
                total: Number(item.total),
            })),
        });
    } catch (error) {
        console.error("REPORTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to generate sales reports",
        });
    }
};

module.exports = { getReports };