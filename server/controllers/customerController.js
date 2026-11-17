
const { Order } = require("../models");

const getCustomers = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        branchId: req.branchId,
      },
      attributes: [
        "id",
        "customerName",
        "guestId",
        "totalAmount",
        "status",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    const customersMap = new Map();

    for (const order of orders) {
      const key = order.guestId
        ? `guest:${order.guestId}`
        : `name:${(order.customerName || "Guest").trim().toLowerCase()}`;

      if (!customersMap.has(key)) {
        customersMap.set(key, {
          customerName: order.customerName || "Guest",
          guestId: order.guestId || null,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt,
        });
      }

      const customer = customersMap.get(key);

      customer.totalOrders += 1;

      if (order.status === "completed") {
        customer.totalSpent += Number(order.totalAmount || 0);
      }
    }

    const customers = Array.from(customersMap.values())
      .map((customer) => ({
        ...customer,
        totalSpent: Number(customer.totalSpent.toFixed(2)),
      }))
      .sort(
        (a, b) =>
          new Date(b.lastOrderDate) - new Date(a.lastOrderDate)
      );

    return res.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers",
    });
  }
};

module.exports = { getCustomers };
