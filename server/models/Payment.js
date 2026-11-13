
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    paymentMethod: {
      type: DataTypes.ENUM("cash", "online"),
      allowNull: false,
      defaultValue: "cash",
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "paid",
        "failed",
        "refunded"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    amountReceived: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    changeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },

    transactionReference: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    recordedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "Payments",
    timestamps: true,
  }
);

module.exports = Payment;
