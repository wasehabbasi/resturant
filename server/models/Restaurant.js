const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Restaurant = sequelize.define(
  "Restaurant",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    portalTheme: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    customerTheme: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "Restaurants",
    timestamps: true,
  }
);

module.exports = Restaurant;