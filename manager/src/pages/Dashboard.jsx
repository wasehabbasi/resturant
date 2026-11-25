import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ShoppingBag,
  DollarSign,
  Utensils,
  Users,
} from "lucide-react";

import StatCard from "../components/StatCard";
import api from "../services/api";
import "./Dashboard.css";
import { useTranslation } from "react-i18next";

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/dashboard/stats");

        setStats(response.data.stats);
        setOrders(response.data.recentOrders || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Dashboard data load nahi ho saka."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const cards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? 0,
      change: "All orders",
      icon: ShoppingBag,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue),
      change: "Completed orders only",
      icon: DollarSign,
    },
    {
      title: "Restaurant Menu Items",
      value: stats?.totalProducts ?? 0,
      change: "Shared restaurant catalog",
      icon: Utensils,
    },
    {
      title: "Guest Sessions",
      value: stats?.totalCustomers ?? 0,
      change: "Unique QR guest sessions",
      icon: Users,
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <h2>{t("dashboard.loading")}</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <h2>{t("dashboard.title")}</h2>
        <p>{error || t("dashboard.error")}</p>
        <button onClick={() => window.location.reload()}>
          {t("dashboard.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.welcome")}</p>
        </div>

        <span className="today-label">
          {t("dashboard.overview")}
        </span>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="orders-section">
        <div className="section-heading">
          <h2>{t("dashboard.recentOrders")}</h2>
          <Link to="/orders">{t("dashboard.viewAll")}</Link>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t("dashboard.orderId")}</th>
                <th>{t("dashboard.customer")}</th>
                <th>{t("dashboard.table")}</th>
                <th>{t("dashboard.items")}</th>
                <th>{t("dashboard.amount")}</th>
                <th>{t("dashboard.date")}</th>
                <th>{t("dashboard.status")}</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7">{t("dashboard.noOrders")}</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const items = order.OrderItems || [];

                  const itemNames = items
                    .map((item) => item.Product?.name)
                    .filter(Boolean)
                    .join(", ");

                  const status = order.status || "pending";

                  return (
                    <tr key={order.id}>
                      <td>
                        {order.orderNumber || `#${order.id}`}
                      </td>

                      <td>
                        {order.customerName || t("dashboard.guest")}
                      </td>

                      <td>
                        {order.RestaurantTable?.tableNumber || "-"}
                      </td>

                      <td>{itemNames || "-"}</td>

                      <td>{formatCurrency(order.totalAmount)}</td>

                      <td>{formatDate(order.createdAt)}</td>

                      <td>
                        <span className={`status ${status}`}>
                          {status.charAt(0).toUpperCase() +
                            status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;