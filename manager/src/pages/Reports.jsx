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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterError, setFilterError] = useState("");

  const fetchReports = async (range = { startDate, endDate }) => {
    try {
      setLoading(true);
      setError("");

      const params =
        range.startDate && range.endDate
          ? {
              startDate: range.startDate,
              endDate: range.endDate,
            }
          : {};

      const response = await api.get("/reports", { params });
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

  const applyDateFilter = () => {
  if (!startDate || !endDate) {
    setFilterError("Please select both start and end dates.");
    return;
  }

  if (startDate > endDate) {
    setFilterError("Start date cannot be after end date.");
    return;
  }

  setFilterError("");
    fetchReports({ startDate, endDate });
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilterError("");
    fetchReports({ startDate: "", endDate: "" });
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
    period === "daily"
      ? data.dailySales
      : period === "weekly"
      ? data.weeklySales
      : data.monthlySales;

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

      {/* DATE RANGE FILTER */}
      <section className="report-panel report-date-filter">
        <div>
          <h2>Filter Reports by Date</h2>
          <p>Select a date range to view filtered reports.</p>
        </div>

        <div className="report-date-controls">
          <label>
            Start Date
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <button onClick={applyDateFilter}>
            Apply Filter
          </button>

          <button
            className="clear-date-filter"
            onClick={clearDateFilter}
          >
            Clear
          </button>
        </div>

        {filterError && (
          <p className="date-filter-error">{filterError}</p>
        )}
      </section>

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

      {data.summary.selectedRange && (
        <div className="reports-summary reports-summary-filtered">
          <div className="report-card">
            <div className="report-card-icon orange">
              <DollarSign size={22} />
            </div>
            <span>Selected Range Revenue</span>
            <h2>{currency(data.summary.selectedRange.revenue)}</h2>
          </div>

          <div className="report-card">
            <div className="report-card-icon blue">
              <ShoppingBag size={22} />
            </div>
            <span>Selected Range Orders</span>
            <h2>{data.summary.selectedRange.totalOrders}</h2>
          </div>
        </div>
      )}

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
              Daily
            </button>

            <button
              className={period === "weekly" ? "active" : ""}
              onClick={() => setPeriod("weekly")}
            >
              Weekly
            </button>

            <button
              className={period === "monthly" ? "active" : ""}
              onClick={() => setPeriod("monthly")}
            >
              Monthly
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
  period === "monthly"
    ? new Date(`${item.label}-01T00:00:00`).toLocaleDateString("en-PK", {
        month: "short",
        year: "2-digit",
      })
    : new Date(`${item.label}T00:00:00`).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: period === "weekly" ? "2-digit" : undefined,
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