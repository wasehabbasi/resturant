
const User = require("./User");
const Category = require("./Category");
const Product = require("./Product");
const RestaurantTable = require("./RestaurantTable");
const Order = require("./Order");
const OrderItem = require("./OrderItem");

// Category - Product
Category.hasMany(Product, {
  foreignKey: "categoryId",
  onDelete: "RESTRICT",
});

Product.belongsTo(Category, {
  foreignKey: "categoryId",
});

// Table - Order
RestaurantTable.hasMany(Order, {
  foreignKey: "tableId",
  onDelete: "RESTRICT",
});

Order.belongsTo(RestaurantTable, {
  foreignKey: "tableId",
});

// Order - OrderItem
Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  onDelete: "CASCADE",
});

OrderItem.belongsTo(Order, {
  foreignKey: "orderId",
});

// Product - OrderItem
Product.hasMany(OrderItem, {
  foreignKey: "productId",
  onDelete: "RESTRICT",
});

OrderItem.belongsTo(Product, {
  foreignKey: "productId",
});

module.exports = {
  User,
  Category,
  Product,
  RestaurantTable,
  Order,
  OrderItem,
};
