import { useEffect, useState } from "react";
import {
  BarChart3,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Download,
} from "lucide-react";

import api from "../services/api";
import "./Reports.css";
import { useTranslation } from "react-i18next";

const Reports = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "ur" ? "ur-PK" : "en-PK";

  const currency = (value) => `Rs. ${Number(value || 0).toLocaleString(numberLocale)}`;
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
        t("reports.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      setFilterError(t("reports.selectBothDates"));
      return;
    }

    if (startDate > endDate) {
      setFilterError(t("reports.invalidDateRange"));
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

  const exportCSV = () => {
    if (!data) return;

    const escapeCSV = (value) => {
      let text = String(value ?? "");

      if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = [
      ["Restaurant Sales Report"],
      ["Report Period", period],
      ["Start Date", startDate || "Default"],
      ["End Date", endDate || "Default"],
      [],
      ["Summary"],
      ["Metric", "Value"],

      ["Today's Revenue", data.summary.today.revenue],
      ["Today's Expenses", data.summary.today.expenses],
      ["Today's Orders", data.summary.today.totalOrders],

      ["This Month Revenue", data.summary.thisMonth.revenue],
      ["This Month Expenses", data.summary.thisMonth.expenses],
      ["This Month Orders", data.summary.thisMonth.totalOrders],
      ["Today's COGS", data.summary.today.cogs],
      ["Today's Gross Profit", data.summary.today.grossProfit],
      ["Today's Net Profit", data.summary.today.profit],

      ["This Month COGS", data.summary.thisMonth.cogs],
      ["This Month Gross Profit", data.summary.thisMonth.grossProfit],
      ["This Month Net Profit", data.summary.thisMonth.profit],
    ];

    if (data.summary.selectedRange) {
      rows.push(
        ["Selected Range Revenue", data.summary.selectedRange.revenue],
        ["Selected Range Expenses", data.summary.selectedRange.expenses],
        ["Selected Range Orders", data.summary.selectedRange.totalOrders],
        [
          "Selected Range COGS",
          data.summary.selectedRange.cogs,
        ],
        [
          "Selected Range Gross Profit",
          data.summary.selectedRange.grossProfit,
        ],
        [
          "Selected Range Net Profit",
          data.summary.selectedRange.profit,
        ],
      );
    }

    rows.push(
      [],
      ["Sales Report"],
      ["Date", "Orders", "Revenue"],
      ...currentSales.map((item) => [
        item.label,
        item.totalOrders,
        item.revenue,
      ]),
      [],
      ["Top Selling Products"],
      ["Product", "Quantity Sold", "Revenue"],
      ...data.topProducts.map((item) => [
        item.name,
        item.totalQuantity,
        item.totalRevenue,
      ]),
      [],
      ["Order Status"],
      ["Status", "Total Orders"],
      ...data.orderStatus.map((item) => [
        item.status,
        item.total,
      ])
    );

    const csvContent = rows
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `restaurant-report-${period}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="reports-page reports-message">
        <RefreshCw className="reports-spin" size={28} />
        <p>{t("reports.loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="reports-page reports-message">
        <p>{error || t("reports.noData")}</p>
        <button onClick={fetchReports}>{t("reports.tryAgain")}</button>
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
          <h1>{t("reports.title")}</h1>
          <p>{t("reports.description")}</p>
        </div>

        <button
          className="reports-refresh"
          onClick={fetchReports}
        >
          <RefreshCw size={16} />
          {t("reports.refresh")}
        </button>

        <button
          className="reports-refresh reports-export"
          onClick={exportCSV}
        >
          <Download size={16} />
          	{t("reports.exportCSV")}
        </button>
      </div>

      {/* DATE RANGE FILTER */}
      <section className="report-panel report-date-filter">
        <div>
          <h2>{t("reports.dateFilter")}</h2>
          <p>{t("reports.dateDescription")}</p>
        </div>

        <div className="report-date-controls">
          <label>
            	{t("reports.startDate")}
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            {t("reports.endDate")}
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <button onClick={applyDateFilter}>
            {t("reports.applyFilter")}
          </button>

          <button
            className="clear-date-filter"
            onClick={clearDateFilter}
          >
            {t("reports.clear")}
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
          <span>{t("reports.todayRevenue")}</span>
          <h2>{currency(data.summary.today.revenue)}</h2>
          <small>{data.summary.today.totalOrders} 	{t("reports.ordersToday")}</small>
        </div>

        <div className="report-card">
          <div className="report-card-icon purple">
            <ShoppingBag size={22} />
          </div>
          <span>{t("reports.todayExpenses")}</span>
          <h2>{currency(data.summary.today.expenses)}</h2>
          <small>{t("reports.expensesToday")}</small>
        </div>

        <div className="report-card">
          <div className="report-card-icon green">
            <TrendingUp size={22} />
          </div>
          <span>{t("reports.netProfit")}</span>
          <h2>{currency(data.summary.today.profit)}</h2>
          <small>{t("reports.profitDescription")}</small>
        </div>

        <div className="report-card">
          <div className="report-card-icon orange">
            <DollarSign size={22} />
          </div>
          <span>{t("reports.monthRevenue")}</span>
          <h2>{currency(data.summary.thisMonth.revenue)}</h2>
          <small>{data.summary.thisMonth.totalOrders} {t("reports.ordersThisMonth")}</small>
        </div>

        <div className="report-card">
          <div className="report-card-icon purple">
            <ShoppingBag size={22} />
          </div>
          <span>{t("reports.monthExpenses")}</span>
          <h2>{currency(data.summary.thisMonth.expenses)}</h2>
          <small>{t("reports.monthExpensesRecorded")}</small>
        </div>

        <div className="report-card">
          <div className="report-card-icon green">
            <TrendingUp size={22} />
          </div>
          <span>Net Profit</span>
          <h2>{currency(data.summary.thisMonth.profit)}</h2>
          <small>Revenue minus COGS and expenses</small>
        </div>

        <div className="report-card">
          <div className="report-card-icon purple">
            <ShoppingBag size={22} />
          </div>
          <span>{t("reports.monthCOGS")}</span>
          <h2>{currency(data.summary.thisMonth.cogs)}</h2>
        </div>

        <div className="report-card">
          <div className="report-card-icon green">
            <TrendingUp size={22} />
          </div>
          <span>{t("reports.monthGrossProfit")}</span>
          <h2>{currency(data.summary.thisMonth.grossProfit)}</h2>
        </div>

        <div className="report-card">
          <div className="report-card-icon purple">
            <ShoppingBag size={22} />
          </div>
          <span>{t("reports.todayCOGS")}</span>
          <h2>{currency(data.summary.today.cogs)}</h2>
        </div>

        <div className="report-card">
          <div className="report-card-icon green">
            <TrendingUp size={22} />
          </div>
          <span>{t("reports.todayGrossProfit")}</span>
          <h2>{currency(data.summary.today.grossProfit)}</h2>
        </div>
      </div>

      {data.summary.selectedRange && (
        <div className="reports-summary reports-summary-filtered">
          <div className="report-card">
            <div className="report-card-icon orange">
              <DollarSign size={22} />
            </div>
            <span>{t("reports.rangeRevenue")}</span>
            <h2>{currency(data.summary.selectedRange.revenue)}</h2>
          </div>

          <div className="report-card">
            <div className="report-card-icon purple">
              <ShoppingBag size={22} />
            </div>
            <span>{t("reports.rangeExpenses")}</span>
            <h2>{currency(data.summary.selectedRange.expenses)}</h2>
          </div>

          <div className="report-card">
            <div className="report-card-icon purple">
              <ShoppingBag size={22} />
            </div>
            <span>{t("reports.rangeCOGS")}</span>
            <h2>{currency(data.summary.selectedRange.cogs)}</h2>
          </div>

          <div className="report-card">
            <div className="report-card-icon green">
              <TrendingUp size={22} />
            </div>
            <span>{t("reports.rangeGrossProfit")}</span>
            <h2>{currency(data.summary.selectedRange.grossProfit)}</h2>
          </div>

          <div className="report-card">
            <div className="report-card-icon green">
              <TrendingUp size={22} />
            </div>
            <span>{t("reports.rangeProfit")}</span>
            <h2>{currency(data.summary.selectedRange.profit)}</h2>
          </div>
        </div>
      )}

      {/* SALES CHART */}
      <section className="report-panel">
        <div className="report-panel-header">
          <div>
            <h2>{t("reports.salesOverview")}</h2>
            <p>{t("reports.salesDescription")}</p>
          </div>

          <div className="report-period">
            <button
              className={period === "daily" ? "active" : ""}
              onClick={() => setPeriod("daily")}
            >
              {t("reports.daily")}
            </button>

            <button
              className={period === "weekly" ? "active" : ""}
              onClick={() => setPeriod("weekly")}
            >
              {t("reports.weekly")}
            </button>

            <button
              className={period === "monthly" ? "active" : ""}
              onClick={() => setPeriod("monthly")}
            >
              {t("reports.monthly")}
            </button>
          </div>
        </div>

        {currentSales.length === 0 ? (
          <p className="report-empty">{t("reports.noSales")}</p>
        ) : (
          <div className="sales-chart">
            {currentSales.map((item) => {
              const height =
                (Number(item.revenue || 0) / maxRevenue) * 100;

              const label =
                period === "monthly"
                  ? new Date(`${item.label}-01T00:00:00`).toLocaleDateString(numberLocale, {
                    month: "short",
                    year: "2-digit",
                  })
                  : new Date(`${item.label}T00:00:00`).toLocaleDateString(numberLocale, {
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
              <h2>{t("reports.bestProducts")}</h2>
              <p>{t("reports.topFive")}</p>
            </div>
          </div>

          {data.topProducts.length === 0 ? (
            <p className="report-empty">{t("reports.noCompletedSales")}</p>
          ) : (
            <div className="top-products-list">
              {data.topProducts.map((product, index) => (
                <div className="top-product-row" key={product.id}>
                  <div className="product-rank">{index + 1}</div>

                  <div className="top-product-info">
                    <strong>{product.name}</strong>
                    <span>{product.totalQuantity} {t("reports.unitsSold")}</span>
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
              <h2>{t("reports.orderStatus")}</h2>
              <p>{t("reports.orderDistribution")}</p>
            </div>
          </div>

          <div className="status-total">
            <strong>{totalStatusOrders}</strong>
            <span>{t("reports.totalOrders")}</span>
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
                      {t(`reports.status.${item.status}`, {
                        defaultValue: item.status,
                      })}
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