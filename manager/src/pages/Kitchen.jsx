
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { RefreshCw, ChefHat, Clock, CheckCircle, X } from "lucide-react";

import api from "../services/api";
import "./Kitchen.css";

const columns = [
  {
    status: "pending",
    title: "New Orders",
    next: "accepted",
    action: "Accept Order",
  },
  {
    status: "accepted",
    title: "Accepted",
    next: "preparing",
    action: "Start Preparing",
  },
  {
    status: "preparing",
    title: "Preparing",
    next: "ready",
    action: "Mark Ready",
  },
  {
    status: "ready",
    title: "Ready to Serve",
    next: null,
    action: null,
  },
];

const Kitchen = () => {
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
        "Unable to load kitchen orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
      setError("Please select a branch and login again.");
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
        "Unable to update order status."
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
      : "N/A";

  if (loading) {
    return (
      <div className="kitchen-loading">
        <RefreshCw className="kitchen-spin" size={28} />
        <p>Loading kitchen orders...</p>
      </div>
    );
  }

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <div>
          <h1>
            <ChefHat size={27} />
            Kitchen Display
          </h1>
          <p>Manage and track incoming restaurant orders.</p>
        </div>

        <button
          className="kitchen-refresh"
          onClick={fetchOrders}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {newOrderAlert && (
        <div className="kitchen-new-order-alert">
          <div>
            <strong>{newOrderAlert.title || "New Order Received!"}</strong>
            <p>{newOrderAlert.message}</p>
          </div>

          <button
            type="button"
            onClick={() => setNewOrderAlert(null)}
            aria-label="Dismiss notification"
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
                    No orders
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
                          Table:{" "}
                          {order.RestaurantTable?.tableNumber || "N/A"}
                        </span>
                        <span>
                          {order.customerName || "Guest"}
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
                              {item.Product?.name || "Food Item"}
                            </strong>
                            <span>
                              Rs. {formatPrice(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="kitchen-order-total">
                        <span>Total</span>
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
                            ? "Updating..."
                            : column.action}
                        </button>
                      ) : (
                        <div className="kitchen-ready-label">
                          <CheckCircle size={16} />
                          Ready for serving
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
