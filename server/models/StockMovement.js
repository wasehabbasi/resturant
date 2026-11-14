const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const StockMovement = sequelize.define("StockMovement", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  inventoryItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("stock_in", "stock_out", "adjustment"),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
  previousQuantity: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
  newQuantity: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = StockMovement;