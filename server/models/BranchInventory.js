const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const BranchInventory = sequelize.define(
  "BranchInventory",
  {
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
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    lowStockThreshold: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["branchId", "inventoryItemId"],
      },
    ],
  }
);

module.exports = BranchInventory;