const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const BranchProduct = sequelize.define(
  "BranchProduct",
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
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    priceOverride: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    tableName: "BranchProducts",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["branchId", "productId"],
      },
    ],
  }
);

module.exports = BranchProduct;