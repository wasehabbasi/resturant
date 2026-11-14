const User = require("./User");
const Restaurant = require("./Restaurant");
const Branch = require("./Branch");
const BranchProduct = require("./BranchProduct");

const Category = require("./Category");
const Product = require("./Product");
const RestaurantTable = require("./RestaurantTable");
const Order = require("./Order");
const OrderItem = require("./OrderItem");

const Notification = require("./Notification");
const Payment = require("./Payment");

const InventoryItem = require("./InventoryItem");
const BranchInventory = require("./BranchInventory");
const StockMovement = require("./StockMovement");

// Restaurant relationships
Restaurant.hasMany(User, { foreignKey: "restaurantId" });
User.belongsTo(Restaurant, { foreignKey: "restaurantId" });

Restaurant.hasMany(Branch, { foreignKey: "restaurantId" });
Branch.belongsTo(Restaurant, { foreignKey: "restaurantId" });

Restaurant.hasMany(Category, { foreignKey: "restaurantId" });
Category.belongsTo(Restaurant, { foreignKey: "restaurantId" });

Restaurant.hasMany(Product, { foreignKey: "restaurantId" });
Product.belongsTo(Restaurant, { foreignKey: "restaurantId" });

// Branch relationships
Branch.hasMany(RestaurantTable, { foreignKey: "branchId" });
RestaurantTable.belongsTo(Branch, { foreignKey: "branchId" });

Branch.hasMany(Order, { foreignKey: "branchId" });
Order.belongsTo(Branch, { foreignKey: "branchId" });

// Branch-specific product overrides
Branch.hasMany(BranchProduct, { foreignKey: "branchId" });
BranchProduct.belongsTo(Branch, { foreignKey: "branchId" });

Product.hasMany(BranchProduct, { foreignKey: "productId" });
BranchProduct.belongsTo(Product, { foreignKey: "productId" });

Branch.belongsToMany(Product, {
  through: BranchProduct,
  foreignKey: "branchId",
  otherKey: "productId",
});

Product.belongsToMany(Branch, {
  through: BranchProduct,
  foreignKey: "productId",
  otherKey: "branchId",
});

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

// Notification relationships
Restaurant.hasMany(Notification, {
  foreignKey: "restaurantId",
});

Notification.belongsTo(Restaurant, {
  foreignKey: "restaurantId",
});

Branch.hasMany(Notification, {
  foreignKey: "branchId",
});

Notification.belongsTo(Branch, {
  foreignKey: "branchId",
});

User.hasMany(Notification, {
  foreignKey: "recipientUserId",
});

Notification.belongsTo(User, {
  foreignKey: "recipientUserId",
});

// Order - Payment
Order.hasMany(Payment, {
  foreignKey: "orderId",
  onDelete: "RESTRICT",
});

Payment.belongsTo(Order, {
  foreignKey: "orderId",
});

// Branch - Payment
Branch.hasMany(Payment, {
  foreignKey: "branchId",
});

Payment.belongsTo(Branch, {
  foreignKey: "branchId",
});

// Inventory relationships
Restaurant.hasMany(InventoryItem, { foreignKey: "restaurantId" });
InventoryItem.belongsTo(Restaurant, { foreignKey: "restaurantId" });

Branch.hasMany(BranchInventory, { foreignKey: "branchId" });
BranchInventory.belongsTo(Branch, { foreignKey: "branchId" });

InventoryItem.hasMany(BranchInventory, { foreignKey: "inventoryItemId" });
BranchInventory.belongsTo(InventoryItem, { foreignKey: "inventoryItemId" });

Branch.hasMany(StockMovement, { foreignKey: "branchId" });
StockMovement.belongsTo(Branch, { foreignKey: "branchId" });

InventoryItem.hasMany(StockMovement, { foreignKey: "inventoryItemId" });
StockMovement.belongsTo(InventoryItem, { foreignKey: "inventoryItemId" });

User.hasMany(StockMovement, { foreignKey: "userId" });
StockMovement.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  User,
  Restaurant,
  Branch,
  BranchProduct,
  Category,
  Product,
  RestaurantTable,
  Order,
  OrderItem,
  Notification,
  Payment,
  InventoryItem,
  BranchInventory,
  StockMovement,
};