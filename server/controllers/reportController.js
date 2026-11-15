const { QueryTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
};

const getReports = async (req, res) => {
    try {
        const branchId = req.branchId;

        const { startDate, endDate } = req.query;

        const hasDateRange = Boolean(startDate || endDate);

        if (hasDateRange) {
            if (
                !startDate ||
                !endDate ||
                !isValidDate(startDate) ||
                !isValidDate(endDate) ||
                startDate > endDate
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid start and end date.",
                });
            }
        }

        const replacements = {
            branchId,
            ...(hasDateRange ? { startDate, endDate } : {}),
        };

        const queryOptions = {
            type: QueryTypes.SELECT,
            replacements,
        };

        const dateFilter = hasDateRange
            ? `AND createdAt >= :startDate
               AND createdAt < DATE_ADD(:endDate, INTERVAL 1 DAY)`
            : "";

        const orderDateFilter = hasDateRange
            ? `AND o.createdAt >= :startDate
               AND o.createdAt < DATE_ADD(:endDate, INTERVAL 1 DAY)`
            : "";

        const expenseDateFilter = hasDateRange
            ? `AND expenseDate >= :startDate
               AND expenseDate < DATE_ADD(:endDate, INTERVAL 1 DAY)`
            : "";

        const [
            todayStats,
            monthlyStats,
            todayExpenses,
            monthlyExpenses,
            selectedRangeExpenses,
            selectedRangeStats,
            dailySales,
            weeklySales,
            monthlySales,
            topProducts,
            orderStatus,
        ] = await Promise.all([

            // Today's summary
            sequelize.query(`
                SELECT
                    COUNT(*) AS totalOrders,
                    SUM(
                        CASE WHEN status = 'completed'
                        THEN totalAmount ELSE 0 END
                    ) AS revenue
                FROM Orders
                WHERE branchId = :branchId
                AND DATE(createdAt) = CURDATE()
            `, queryOptions),

            // Current month's summary
            sequelize.query(`
                SELECT
                    COUNT(*) AS totalOrders,
                    SUM(
                        CASE WHEN status = 'completed'
                        THEN totalAmount ELSE 0 END
                    ) AS revenue
                FROM Orders
                WHERE branchId = :branchId
                AND YEAR(createdAt) = YEAR(CURDATE())
                AND MONTH(createdAt) = MONTH(CURDATE())
            `, queryOptions),

            // Today's expenses
            sequelize.query(`
                SELECT COALESCE(SUM(amount), 0) AS expenses
                FROM Expenses
                WHERE branchId = :branchId
                AND DATE(expenseDate) = CURDATE()
            `, queryOptions),

            // Current month's expenses
            sequelize.query(`
                SELECT COALESCE(SUM(amount), 0) AS expenses
                FROM Expenses
                WHERE branchId = :branchId
                AND YEAR(expenseDate) = YEAR(CURDATE())
                AND MONTH(expenseDate) = MONTH(CURDATE())
            `, queryOptions),

            // Selected date range expenses
            hasDateRange
                ? sequelize.query(`
                    SELECT COALESCE(SUM(amount), 0) AS expenses
                    FROM Expenses
                    WHERE branchId = :branchId
                    ${expenseDateFilter}
                `, queryOptions)
                : Promise.resolve(null),

            // Selected date range summary
            hasDateRange
                ? sequelize.query(`
                    SELECT
                        COUNT(*) AS totalOrders,
                        SUM(
                            CASE WHEN status = 'completed'
                            THEN totalAmount ELSE 0 END
                        ) AS revenue
                    FROM Orders
                    WHERE branchId = :branchId
                    ${dateFilter}
                `, queryOptions)
                : Promise.resolve(null),

            // Daily sales
            sequelize.query(`
                SELECT
                    DATE_FORMAT(createdAt, '%Y-%m-%d') AS label,
                    COUNT(*) AS totalOrders,
                    SUM(
                        CASE WHEN status = 'completed'
                        THEN totalAmount ELSE 0 END
                    ) AS revenue
                FROM Orders
                WHERE branchId = :branchId
                ${hasDateRange
                    ? dateFilter
                    : `AND DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                           AND DATE(createdAt) <= CURDATE()`
                }
                GROUP BY DATE(createdAt)
                ORDER BY DATE(createdAt) ASC
            `, queryOptions),

            // Weekly sales
            sequelize.query(`
                SELECT
                    DATE_FORMAT(
                        DATE_SUB(DATE(createdAt), INTERVAL WEEKDAY(createdAt) DAY),
                        '%Y-%m-%d'
                    ) AS label,
                    COUNT(*) AS totalOrders,
                    SUM(
                        CASE WHEN status = 'completed'
                        THEN totalAmount ELSE 0 END
                    ) AS revenue
                FROM Orders
                WHERE branchId = :branchId
                ${hasDateRange
                    ? dateFilter
                    : `AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 WEEK)
                           AND createdAt <= NOW()`
                }
                GROUP BY YEARWEEK(createdAt, 1)
                ORDER BY YEARWEEK(createdAt, 1) ASC
            `, queryOptions),

            // Monthly sales
            sequelize.query(`
                SELECT
                    DATE_FORMAT(createdAt, '%Y-%m') AS label,
                    COUNT(*) AS totalOrders,
                    SUM(
                        CASE WHEN status = 'completed'
                        THEN totalAmount ELSE 0 END
                    ) AS revenue
                FROM Orders
                WHERE branchId = :branchId
                ${hasDateRange
                    ? dateFilter
                    : `AND createdAt >= DATE_FORMAT(
                                DATE_SUB(CURDATE(), INTERVAL 11 MONTH),
                                '%Y-%m-01'
                            )
                           AND createdAt < DATE_ADD(LAST_DAY(CURDATE()), INTERVAL 1 DAY)`
                }
                GROUP BY YEAR(createdAt), MONTH(createdAt)
                ORDER BY YEAR(createdAt), MONTH(createdAt)
            `, queryOptions),

            // Top 5 products
            sequelize.query(`
                SELECT
                    p.id,
                    p.name,
                    SUM(oi.quantity) AS totalQuantity,
                    SUM(oi.subtotal) AS totalRevenue
                FROM OrderItems oi
                INNER JOIN Orders o ON o.id = oi.orderId
                INNER JOIN Products p ON p.id = oi.productId
                WHERE o.branchId = :branchId
                AND o.status = 'completed'
                ${orderDateFilter}
                GROUP BY p.id, p.name
                ORDER BY totalQuantity DESC
                LIMIT 5
            `, queryOptions),

            // Order status breakdown
            sequelize.query(`
                SELECT
                    status,
                    COUNT(*) AS total
                FROM Orders
                WHERE branchId = :branchId
                ${dateFilter}
                GROUP BY status
            `, queryOptions),
        ]);

        const getCOGS = async (filter = "") => {
            const result = await sequelize.query(`
        SELECT
            COALESCE(
                SUM(oi.ingredientCost * oi.quantity),
                0
            ) AS cogs
        FROM OrderItems oi
        INNER JOIN Orders o ON o.id = oi.orderId
        WHERE o.branchId = :branchId
        AND o.status = 'completed'
        ${filter}
    `, queryOptions);

            return Number(result[0].cogs || 0);
        };

        const todayCOGS = await getCOGS(
            "AND DATE(o.createdAt) = CURDATE()"
        );

        const monthlyCOGS = await getCOGS(`
    AND YEAR(o.createdAt) = YEAR(CURDATE())
    AND MONTH(o.createdAt) = MONTH(CURDATE())
`);

        const selectedRangeCOGS = hasDateRange
            ? await getCOGS(orderDateFilter)
            : null;

        return res.status(200).json({
            success: true,

            summary: {
                today: {
                    totalOrders: Number(todayStats[0].totalOrders || 0),
                    revenue: Number(todayStats[0].revenue || 0),
                    expenses: Number(todayExpenses[0].expenses || 0),
                    cogs: todayCOGS,
                    grossProfit:
                        Number(todayStats[0].revenue || 0) - todayCOGS,
                    profit:
                        Number(todayStats[0].revenue || 0) -
                        todayCOGS -
                        Number(todayExpenses[0].expenses || 0),
                },

                thisMonth: {
                    totalOrders: Number(monthlyStats[0].totalOrders || 0),
                    revenue: Number(monthlyStats[0].revenue || 0),
                    expenses: Number(monthlyExpenses[0].expenses || 0),
                    cogs: monthlyCOGS,
                    grossProfit:
                        Number(monthlyStats[0].revenue || 0) - monthlyCOGS,
                    profit:
                        Number(monthlyStats[0].revenue || 0) -
                        monthlyCOGS -
                        Number(monthlyExpenses[0].expenses || 0),
                },

                selectedRange: selectedRangeStats
                    ? {
                        totalOrders: Number(selectedRangeStats[0].totalOrders || 0),
                        revenue: Number(selectedRangeStats[0].revenue || 0),
                        expenses: Number(selectedRangeExpenses[0].expenses || 0),
                        cogs: selectedRangeCOGS,
                        grossProfit:
                            Number(selectedRangeStats[0].revenue || 0) -
                            selectedRangeCOGS,
                        profit:
                            Number(selectedRangeStats[0].revenue || 0) -
                            selectedRangeCOGS -
                            Number(selectedRangeExpenses[0].expenses || 0),
                    }
                    : null,
            },

            dailySales: dailySales.map((item) => ({
                label: item.label,
                totalOrders: Number(item.totalOrders),
                revenue: Number(item.revenue || 0),
            })),

            weeklySales: weeklySales.map((item) => ({
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