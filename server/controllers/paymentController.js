
const { Payment, Order } = require("../models");
const { sequelize } = require("../config/database");

const recordCashPayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const orderId = Number(req.params.orderId);
    const amount = Number(req.body.amount);
    const amountReceived = Number(req.body.amountReceived);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (
      !Number.isFinite(amount) ||
      !Number.isFinite(amountReceived) ||
      amount <= 0 ||
      amountReceived < amount
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Enter a valid payment amount and cash received",
      });
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        branchId: req.branchId,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found in this branch",
      });
    }

    if (order.status === "cancelled") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot receive payments",
      });
    }

    const totalPaid = Number(
      (await Payment.sum("amount", {
        where: {
          orderId: order.id,
          branchId: req.branchId,
          status: "paid",
        },
        transaction,
      })) || 0
    );

    const orderTotal = Number(order.totalAmount);
    const remaining = Math.round((orderTotal - totalPaid) * 100) / 100;

    if (remaining <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "This order is already fully paid",
      });
    }

    if (amount > remaining) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Remaining amount is Rs. ${remaining}`,
      });
    }

    const changeAmount = Math.round(
      (amountReceived - amount) * 100
    ) / 100;

    const payment = await Payment.create(
      {
        orderId: order.id,
        branchId: req.branchId,
        paymentMethod: "cash",
        status: "paid",
        amount,
        amountReceived,
        changeAmount,
        paidAt: new Date(),
        recordedBy: req.userId,
      },
      { transaction }
    );

    await transaction.commit();

    const newTotalPaid = Math.round(
      (totalPaid + amount) * 100
    ) / 100;

    return res.status(201).json({
      success: true,
      message: "Cash payment recorded successfully",
      payment,
      summary: {
        orderTotal,
        totalPaid: newTotalPaid,
        remainingAmount: Math.max(
          0,
          Math.round((orderTotal - newTotalPaid) * 100) / 100
        ),
        changeAmount,
        isFullyPaid: newTotalPaid >= orderTotal,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("CASH PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to record cash payment",
    });
  }
};

const getOrderPaymentSummary = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        branchId: req.branchId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found in this branch",
      });
    }

    const payments = await Payment.findAll({
      where: {
        orderId: order.id,
        branchId: req.branchId,
      },
      order: [["createdAt", "DESC"]],
    });

    const totalPaid = payments
      .filter((payment) => payment.status === "paid")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const orderTotal = Number(order.totalAmount);
    const remainingAmount = Math.max(
      0,
      Math.round((orderTotal - totalPaid) * 100) / 100
    );

    return res.json({
      success: true,
      summary: {
        orderTotal,
        totalPaid: Math.round(totalPaid * 100) / 100,
        remainingAmount,
        isFullyPaid: remainingAmount === 0,
      },
      payments,
    });
  } catch (error) {
    console.error("PAYMENT SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment summary",
    });
  }
};

module.exports = { recordCashPayment, getOrderPaymentSummary };
