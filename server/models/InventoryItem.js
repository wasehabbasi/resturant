const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const InventoryItem = sequelize.define("InventoryItem", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: "pcs",
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = InventoryItem;