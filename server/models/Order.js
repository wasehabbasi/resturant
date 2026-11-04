
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },

  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },

  status: {
    type: DataTypes.ENUM(
      "pending",
      "accepted",
      "preparing",
      "ready",
      "completed",
      "cancelled"
    ),
    defaultValue: "pending",
  },
});

module.exports = Order;
