
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ProductIngredient = sequelize.define(
  "ProductIngredient",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    inventoryItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantityPerProduct: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      validate: { min: 0.001 },
    },
  },
  {
    tableName: "ProductIngredients",
    indexes: [
      {
        unique: true,
        fields: ["productId", "inventoryItemId"],
      },
    ],
  }
);

module.exports = ProductIngredient;
