const { Expense } = require("../models");

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

const validPaymentMethods = ["cash", "bank", "card", "other"];

const getExpenses = async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = {
            restaurantId: req.restaurantId,
            branchId: req.branchId,
        };

        if (from || to) {
            where.expenseDate = {};
            if (from) where.expenseDate[require("sequelize").Op.gte] = from;
            if (to) where.expenseDate[require("sequelize").Op.lte] = to;
        }

        const expenses = await Expense.findAll({
            where,
            order: [["expenseDate", "DESC"], ["createdAt", "DESC"]],
        });

        const total = expenses.reduce(
            (sum, item) => sum + Number(item.amount),
            0
        );

        return res.json({
            success: true,
            expenses,
            total: Number(total.toFixed(2)),
        });
    } catch (error) {
        console.error("GET EXPENSES ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch expenses",
        });
    }
};

const createExpense = async (req, res) => {
    try {
        const {
            category,
            description,
            amount,
            expenseDate,
            paymentMethod,
        } = req.body;

        const value = Number(amount);

        if (!category?.trim() || !expenseDate ||
            !Number.isFinite(value) || value <= 0) {
            return res.status(400).json({
                success: false,
                message: "Category, valid amount and expense date are required",
            });
        }

        if (!isValidDate(expenseDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense date",
            });
        }

        if (
            paymentMethod !== undefined &&
            !validPaymentMethods.includes(paymentMethod)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method",
            });
        }

        const expense = await Expense.create({
            restaurantId: req.restaurantId,
            branchId: req.branchId,
            category: category.trim(),
            description: description?.trim() || null,
            amount: value,
            expenseDate,
            paymentMethod: paymentMethod || "cash",
            recordedBy: req.userId,
        });

        return res.status(201).json({
            success: true,
            message: "Expense added successfully",
            expense,
        });
    } catch (error) {
        console.error("CREATE EXPENSE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to add expense",
        });
    }
};

const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findOne({
            where: {
                id: req.params.id,
                restaurantId: req.restaurantId,
                branchId: req.branchId,
            },
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        const { category, description, amount, expenseDate, paymentMethod } = req.body;

        if (category !== undefined) {
            if (typeof category !== "string" || !category.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid expense category",
                });
            }
            expense.category = category.trim();
        }

        if (amount !== undefined) {
            const value = Number(amount);
            if (!Number.isFinite(value) || value <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid expense amount",
                });
            }
            expense.amount = value;
        }

        if (description !== undefined) {
            expense.description = description?.trim() || null;
        }

        if (expenseDate !== undefined) {
            if (!isValidDate(expenseDate)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid expense date",
                });
            }

            expense.expenseDate = expenseDate;
        }

        if (paymentMethod !== undefined) {
            if (!validPaymentMethods.includes(paymentMethod)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid payment method",
                });
            }
            expense.paymentMethod = paymentMethod;
        }

        await expense.save();

        return res.json({
            success: true,
            message: "Expense updated successfully",
            expense,
        });
    } catch (error) {
        console.error("UPDATE EXPENSE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update expense",
        });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findOne({
            where: {
                id: req.params.id,
                restaurantId: req.restaurantId,
                branchId: req.branchId,
            },
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        await expense.destroy();

        return res.json({
            success: true,
            message: "Expense deleted successfully",
        });
    } catch (error) {
        console.error("DELETE EXPENSE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete expense",
        });
    }
};

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
};
