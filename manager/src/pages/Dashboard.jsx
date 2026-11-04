
import {
  ShoppingBag,
  DollarSign,
  Utensils,
  Users,
} from "lucide-react";

import StatCard from "../components/StatCard";
import "./Dashboard.css";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Orders",
      value: "125",
      change: "+12% this month",
      icon: ShoppingBag,
    },
    {
      title: "Total Revenue",
      value: "Rs. 85,000",
      change: "+8% this month",
      icon: DollarSign,
    },
    {
      title: "Food Items",
      value: "48",
      change: "Available menu items",
      icon: Utensils,
    },
    {
      title: "Customers",
      value: "96",
      change: "Total customers",
      icon: Users,
    },
  ];

  const orders = [
    {
      id: "#ORD001",
      customer: "Ali Ahmed",
      item: "Chicken Burger",
      amount: "Rs. 850",
      status: "Completed",
    },
    {
      id: "#ORD002",
      customer: "Ahmed Khan",
      item: "Large Pizza",
      amount: "Rs. 1800",
      status: "Preparing",
    },
    {
      id: "#ORD003",
      customer: "Sara Ali",
      item: "French Fries",
      amount: "Rs. 450",
      status: "Pending",
    },
    {
      id: "#ORD004",
      customer: "Usman",
      item: "Zinger Burger",
      amount: "Rs. 700",
      status: "Completed",
    },
  ];

  return (
    <div className="dashboard-page">

      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your restaurant overview.</p>
        </div>

        <span className="today-label">
          Restaurant Overview
        </span>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="orders-section">
        <div className="section-heading">
          <h2>Recent Orders</h2>
          <button>View All</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Item</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.item}</td>
                  <td>{order.amount}</td>
                  <td>
                    <span
                      className={`status ${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
