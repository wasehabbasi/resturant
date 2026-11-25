
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { RefreshCw, ChefHat, Clock, CheckCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import api from "../services/api";
import "./Kitchen.css";

const Kitchen = () => {
  const { t } = useTranslation();

  const columns = [
    {
      status: "pending",
      title: t("kitchen.newOrders"),
      next: "accepted",
      action: t("kitchen.acceptOrder"),
    },
    {
      status: "accepted",
      title: t("kitchen.accepted"),
      next: "preparing",
      action: t("kitchen.startPreparing"),
    },
    {
      status: "preparing",
      title: t("kitchen.preparing"),
      next: "ready",
      action: t("kitchen.markReady"),
    },
    {
      status: "ready",
      title: t("kitchen.readyToServe"),
      next: null,
      action: null,
    },
  ];

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get("/orders");
      setOrders(response.data.orders || []);
      setError("");
    } catch (err) {
      console.error("KITCHEN ORDERS ERROR:", err);
      setError(
        err.response?.data?.message ||
        t("kitchen.loadError")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchOrders();

    const storage = localStorage.getItem("token")
      ? localStorage
      : sessionStorage;

    const token = storage.getItem("token");

    const branchId =
      storage.getItem("currentBranchId") ||
      storage.getItem("branchId");

    if (!token || !branchId) {
      setError(t("kitchen.branchRequired"));
      return;
    }

    const socket = io("http://localhost:5000", {
      auth: {
        token,
        branchId,
      },
    });

    socket.on("notification:new", (notification) => {
      if (notification.type === "new_order") {
        setNewOrderAlert(notification);
        fetchOrders();
      }
    }); 

    socket.on("order:updated", () => {
      fetchOrders();
    });

    socket.on("connect_error", (err) => {
      console.error("KITCHEN SOCKET ERROR:", err.message);
    });

    return () => socket.disconnect();
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      setError("");

      await api.patch(`/orders/${orderId}/status`, { status });

      await fetchOrders();
    } catch (err) {
      console.error("KITCHEN STATUS ERROR:", err);

      setError(
        err.response?.data?.message ||
        t("kitchen.updateError")
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString("en-PK", {
      maximumFractionDigits: 2,
    });

  const formatTime = (date) =>
    date
      ? new Date(date).toLocaleTimeString("en-PK", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : t("kitchen.notAvailable");

  if (loading) {
    return (
      <div className="kitchen-loading">
        <RefreshCw className="kitchen-spin" size={28} />
        <p>{t("kitchen.loading")}</p>
      </div>
    );
  }

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <div>
          <h1>
            <ChefHat size={27} />
            {t("kitchen.title")}
          </h1>
          <p>{t("kitchen.description")}</p>
        </div>

        <button
          className="kitchen-refresh"
          onClick={fetchOrders}
        >
          <RefreshCw size={16} />
          {t("kitchen.refresh")}
        </button>
      </div>

      {newOrderAlert && (
        <div className="kitchen-new-order-alert">
          <div>
            <strong>{newOrderAlert.title || t("kitchen.newOrderReceived")}</strong>
            <p>{newOrderAlert.message}</p>
          </div>

          <button
            type="button"
            onClick={() => setNewOrderAlert(null)}
            aria-label={t("kitchen.dismiss")}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="kitchen-error">{error}</div>
      )}

      <div className="kitchen-summary">
        {columns.map((column) => (
          <div className="kitchen-summary-card" key={column.status}>
            <span>{column.title}</span>
            <strong>
              {orders.filter(
                (order) => order.status === column.status
              ).length}
            </strong>
          </div>
        ))}
      </div>

      <div className="kitchen-board">
        {columns.map((column) => {
          const columnOrders = orders.filter(
            (order) => order.status === column.status
          );

          return (
            <section
              className={`kitchen-column kitchen-${column.status}`}
              key={column.status}
            >
              <div className="kitchen-column-header">
                <h2>{column.title}</h2>
                <span>{columnOrders.length}</span>
              </div>

              <div className="kitchen-column-content">
                {columnOrders.length === 0 ? (
                  <div className="kitchen-empty">
                    {t("kitchen.noOrders")}
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <article
                      className="kitchen-order-card"
                      key={order.id}
                    >
                      <div className="kitchen-order-top">
                        <strong>{order.orderNumber}</strong>
                        <span>
                          <Clock size={13} />
                          {formatTime(order.createdAt)}
                        </span>
                      </div>

                      <div className="kitchen-order-info">
                        <span>
                          {t("kitchen.table")}:{" "}
                          {order.RestaurantTable?.tableNumber || t("kitchen.notAvailable")}
                        </span>
                        <span>
                          {order.customerName || t("kitchen.guest")}
                        </span>
                      </div>

                      <div className="kitchen-items">
                        {(order.OrderItems || []).map((item) => (
                          <div
                            className="kitchen-item"
                            key={item.id}
                          >
                            <strong>
                              {item.quantity} ×{" "}
                              {item.Product?.name || t("kitchen.foodItem")}
                            </strong>
                            <span>
                              Rs. {formatPrice(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="kitchen-order-total">
                        <span>{t("kitchen.total")}</span>
                        <strong>
                          Rs. {formatPrice(order.totalAmount)}
                        </strong>
                      </div>

                      {column.next ? (
                        <button
                          className="kitchen-action"
                          disabled={updatingId === order.id}
                          onClick={() =>
                            updateStatus(order.id, column.next)
                          }
                        >
                          {updatingId === order.id
                            ? t("kitchen.updating")
                            : column.action}
                        </button>
                      ) : (
                        <div className="kitchen-ready-label">
                          <CheckCircle size={16} />
                          {t("kitchen.readyForServing")}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Kitchen;
