import { useEffect, useState } from "react";
import {
  BarChart3,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";
import "./Reports.css";

const currency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;

const Reports = () => {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/reports");
      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="reports-page reports-message">
        <RefreshCw className="reports-spin" size={28} />
        <p>Loading sales reports...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="reports-page reports-message">
        <p>{error || "No report data available."}</p>
        <button onClick={fetchReports}>Try Again</button>
      </div>
    );
  }

  const currentSales =
    period === "daily" ? data.dailySales : data.monthlySales;

  const maxRevenue = Math.max(
    ...currentSales.map((item) => Number(item.revenue || 0)),
    1
  );

  const totalStatusOrders = data.orderStatus.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const statusColors = {
    pending: "#f59e0b",
    accepted: "#3b82f6",
    preparing: "#8b5cf6",
    ready: "#06b6d4",
    completed: "#16a34a",
    cancelled: "#ef4444",
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Sales Reports</h1>
          <p>Track your restaurant's sales and performance.</p>
        </div>

        <button
          className="reports-refresh"
          onClick={fetchReports}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="reports-summary">
        <div className="report-card">
          <div className="report-card-icon orange">
            <DollarSign size={22} />
          </div>
          <span>Today's Revenue</span>
          <h2>{currency(data.summary.today.revenue)}</h2>
          <small>
            {data.summary.today.totalOrders} orders today
          </small>
        </div>

        <div className="report-card">
          <div className="report-card-icon blue">
            <ShoppingBag size={22} />
          </div>
          <span>Today's Orders</span>
          <h2>{data.summary.today.totalOrders}</h2>
          <small>All order statuses</small>
        </div>

        <div className="report-card">
          <div className="report-card-icon green">
            <TrendingUp size={22} />
          </div>
          <span>This Month's Revenue</span>
          <h2>{currency(data.summary.thisMonth.revenue)}</h2>
          <small>
            {data.summary.thisMonth.totalOrders} orders this month
          </small>
        </div>

        <div className="report-card">
          <div className="report-card-icon purple">
            <BarChart3 size={22} />
          </div>
          <span>This Month's Orders</span>
          <h2>{data.summary.thisMonth.totalOrders}</h2>
          <small>All order statuses</small>
        </div>
      </div>

      {/* SALES CHART */}
      <section className="report-panel">
        <div className="report-panel-header">
          <div>
            <h2>Sales Overview</h2>
            <p>Revenue from completed orders</p>
          </div>

          <div className="report-period">
            <button
              className={period === "daily" ? "active" : ""}
              onClick={() => setPeriod("daily")}
            >
              Last 7 Days
            </button>

            <button
              className={period === "monthly" ? "active" : ""}
              onClick={() => setPeriod("monthly")}
            >
              Last 12 Months
            </button>
          </div>
        </div>

        {currentSales.length === 0 ? (
          <p className="report-empty">No sales data available.</p>
        ) : (
          <div className="sales-chart">
            {currentSales.map((item) => {
              const height =
                (Number(item.revenue || 0) / maxRevenue) * 100;

              const label =
                period === "daily"
                  ? new Date(`${item.label}T00:00:00`)
                      .toLocaleDateString("en-PK", {
                        day: "2-digit",
                        month: "short",
                      })
                  : new Date(`${item.label}-01T00:00:00`)
                      .toLocaleDateString("en-PK", {
                        month: "short",
                        year: "2-digit",
                      });

              return (
                <div className="sales-chart-column" key={item.label}>
                  <strong>{currency(item.revenue)}</strong>

                  <div className="sales-bar-area">
                    <div
                      className="sales-bar"
                      style={{ height: `${height}%` }}
                      title={currency(item.revenue)}
                    />
                  </div>

                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* BOTTOM PANELS */}
      <div className="reports-bottom-grid">
        <section className="report-panel">
          <div className="report-panel-header">
            <div>
              <h2>Best-Selling Products</h2>
              <p>Top 5 by quantity sold</p>
            </div>
          </div>

          {data.topProducts.length === 0 ? (
            <p className="report-empty">No completed sales yet.</p>
          ) : (
            <div className="top-products-list">
              {data.topProducts.map((product, index) => (
                <div className="top-product-row" key={product.id}>
                  <div className="product-rank">{index + 1}</div>

                  <div className="top-product-info">
                    <strong>{product.name}</strong>
                    <span>{product.totalQuantity} units sold</span>
                  </div>

                  <strong>{currency(product.totalRevenue)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="report-panel">
          <div className="report-panel-header">
            <div>
              <h2>Order Status</h2>
              <p>Overall order distribution</p>
            </div>
          </div>

          <div className="status-total">
            <strong>{totalStatusOrders}</strong>
            <span>Total Orders</span>
          </div>

          <div className="status-breakdown">
            {data.orderStatus.map((item) => {
              const percentage = totalStatusOrders
                ? (item.total / totalStatusOrders) * 100
                : 0;

              return (
                <div className="status-breakdown-row" key={item.status}>
                  <div className="status-breakdown-label">
                    <span>
                      <i
                        style={{
                          background:
                            statusColors[item.status] || "#999",
                        }}
                      />
                      {item.status}
                    </span>

                    <strong>{item.total}</strong>
                  </div>

                  <div className="status-progress">
                    <div
                      style={{
                        width: `${percentage}%`,
                        background:
                          statusColors[item.status] || "#999",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reports;