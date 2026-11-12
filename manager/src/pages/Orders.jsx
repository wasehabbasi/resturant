import { useCallback, useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  ShoppingBag,
  Clock,
  ChefHat,
  CheckCircle,
  Search,
  Package,
  XCircle,
} from "lucide-react";

import api from "../services/api";
import "./Orders.css";
import { io } from "socket.io-client";

const statuses = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

const statusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

const nextStatus = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

const actionLabels = {
  accepted: "Accept Order",
  preparing: "Start Preparing",
  ready: "Mark Ready",
  completed: "Complete Order",
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("soundAlertsEnabled") === "true"
  );

  const [soundReady, setSoundReady] = useState(false);

  const audioContextRef = useRef(null);

  const soundEnabledRef = useRef(
    localStorage.getItem("soundAlertsEnabled") === "true"
  );

  // Play a short notification sound
  const playNewOrderSound = () => {
    const audioContext = audioContextRef.current;

    if (!soundEnabledRef.current || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime
    );

    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.2,
      audioContext.currentTime + 0.03
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.35
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.36);
  };

  // Enable or disable sound alerts
  const toggleSoundAlerts = async () => {
  // Sound already active: turn it OFF
  if (soundEnabled && soundReady) {
    soundEnabledRef.current = false;
    setSoundEnabled(false);
    setSoundReady(false);
    localStorage.setItem("soundAlertsEnabled", "false");
    return;
  }

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      setError("Your browser does not support sound alerts.");
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    await audioContextRef.current.resume();

    soundEnabledRef.current = true;
    setSoundEnabled(true);
    setSoundReady(true);

    localStorage.setItem("soundAlertsEnabled", "true");

    // Play test sound
    playNewOrderSound();
  } catch (error) {
    console.error("SOUND ALERT ERROR:", error);
    setError("Unable to activate sound alerts.");
  }
};

  // Fetch orders from backend
  const fetchOrders = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);

      const response = await api.get("/orders");

      setOrders(response.data.orders || []);
      setError("");
    } catch (err) {
      console.error("FETCH ORDERS ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load orders. Please check your connection."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and automatic refresh
  // Initial load and real-time new order updates
  
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
      console.error("Socket connection: token or branch ID missing");
      return;
    }

    const socket = io("http://localhost:5000", {
      auth: {
        token,
        branchId,
      },
    });

    socket.on("connect", () => {
      console.log("Orders Socket Connected:", socket.id);
    });

    socket.on("notification:new", (notification) => {
      if (notification.type === "new_order") {
        console.log("New order received:", notification.data);
        fetchOrders();
        playNewOrderSound();
      }
    });

    socket.on("order:updated", (data) => {
      console.log("Order status updated:", data);
      fetchOrders();
    });

    socket.on("connect_error", (error) => {
      console.error("Orders Socket Error:", error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchOrders, soundEnabled]);


  // Update order status
  const handleStatusUpdate = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      setError("");
      setMessage("");

      await api.patch(`/orders/${orderId}/status`, {
        status,
      });

      setMessage(
        `Order status updated to ${statusLabels[status]}.`
      );

      await fetchOrders();
    } catch (err) {
      console.error("UPDATE ORDER ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Search and filter
  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      filter === "all" || order.status === filter;

    const searchText = search.toLowerCase();

    const matchesSearch = [
      order.orderNumber,
      order.customerName,
      order.RestaurantTable?.tableNumber,
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchText)
    );

    return matchesFilter && matchesSearch;
  });

  const countStatus = (status) =>
    orders.filter((order) => order.status === status).length;

  const totalRevenue = orders
    .filter((order) =>
      ["accepted", "preparing", "ready", "completed"].includes(
        order.status
      )
    )
    .reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString("en-PK", {
      maximumFractionDigits: 2,
    });

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <RefreshCw className="orders-spin" size={30} />
        <p>Loading restaurant orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">

      {/* PAGE HEADER */}
      <div className="orders-header">
        <div>
          <h1>Orders Management</h1>
          <p>
            Manage customer orders and track restaurant activity.
          </p>
        </div>

        <button
          type="button"
          className={`orders-sound-btn ${soundEnabled ? "sound-enabled" : ""
            }`}
          onClick={toggleSoundAlerts}
        >
          {soundReady
            ? "Sound: ON"
            : soundEnabled
              ? "Activate Sound"
              : "Enable Sound"}
        </button>

        <button
          className="orders-refresh-btn"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "orders-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="orders-alert orders-error">
          {error}
        </div>
      )}

      {message && (
        <div className="orders-alert orders-success">
          {message}
        </div>
      )}

      {/* STATISTICS */}
      <div className="orders-stats">

        <div className="orders-stat-card">
          <div className="orders-stat-icon purple">
            <ShoppingBag size={22} />
          </div>
          <div>
            <span>Total Orders</span>
            <h2>{orders.length}</h2>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon orange">
            <Clock size={22} />
          </div>
          <div>
            <span>Pending</span>
            <h2>{countStatus("pending")}</h2>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon blue">
            <ChefHat size={22} />
          </div>
          <div>
            <span>Preparing</span>
            <h2>{countStatus("preparing")}</h2>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon green">
            <CheckCircle size={22} />
          </div>
          <div>
            <span>Completed</span>
            <h2>{countStatus("completed")}</h2>
          </div>
        </div>

      </div>

      {/* REVENUE */}
      <div className="orders-revenue">
        <div>
          <span>Value of Accepted and Completed Orders</span>
          <h2>Rs. {formatPrice(totalRevenue)}</h2>
        </div>

        <ShoppingBag size={30} />
      </div>

      {/* SEARCH AND FILTER */}
      <div className="orders-toolbar">

        <div className="orders-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search order, customer or table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Orders</option>

          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>

      </div>

      {/* ORDER LIST */}
      <div className="orders-list">

        <div className="orders-list-heading">
          <div>
            <h2>Restaurant Orders</h2>
            <p>{filteredOrders.length} orders found</p>
          </div>

          <span className="orders-live">
            ● Auto refresh: 5 seconds
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <Package size={48} />

            <h3>No Orders Found</h3>

            <p>
              Customer orders will appear here.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const items = order.OrderItems || [];
            const next = nextStatus[order.status];

            return (
              <div className="order-card" key={order.id}>

                {/* ORDER HEADER */}
                <div className="order-card-header">

                  <div>
                    <h3>{order.orderNumber}</h3>

                    <p>{formatDate(order.createdAt)}</p>
                  </div>

                  <span
                    className={`order-status status-${order.status}`}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>

                </div>

                {/* CUSTOMER INFORMATION */}
                <div className="order-customer-info">

                  <div>
                    <span>Customer</span>
                    <strong>
                      {order.customerName || "Guest"}
                    </strong>
                  </div>

                  <div>
                    <span>Table</span>
                    <strong>
                      {order.RestaurantTable?.tableNumber || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Order ID</span>
                    <strong>#{order.id}</strong>
                  </div>

                </div>

                {/* ORDER ITEMS */}
                <div className="order-items">

                  <h4>Ordered Items</h4>

                  {items.length === 0 ? (
                    <p>No items found.</p>
                  ) : (
                    items.map((item) => (
                      <div
                        className="order-item-row"
                        key={item.id}
                      >
                        <div>
                          <strong>
                            {item.Product?.name || "Food Item"}
                          </strong>

                          <span>
                            {item.quantity} × Rs.{" "}
                            {formatPrice(item.price)}
                          </span>
                        </div>

                        <strong>
                          Rs. {formatPrice(item.subtotal)}
                        </strong>
                      </div>
                    ))
                  )}

                </div>

                {/* FOOTER */}
                <div className="order-card-footer">

                  <div>
                    <span>Order Total</span>
                    <h3>
                      Rs. {formatPrice(order.totalAmount)}
                    </h3>
                  </div>

                  <div className="order-actions">

                    {next && (
                      <button
                        className="next-status-btn"
                        disabled={updatingId === order.id}
                        onClick={() =>
                          handleStatusUpdate(order.id, next)
                        }
                      >
                        {updatingId === order.id
                          ? "Updating..."
                          : actionLabels[next]}
                      </button>
                    )}

                    {[
                      "pending",
                      "accepted",
                      "preparing",
                      "ready",
                    ].includes(order.status) && (
                        <button
                          className="cancel-order-btn"
                          disabled={updatingId === order.id}
                          onClick={() =>
                            handleStatusUpdate(
                              order.id,
                              "cancelled"
                            )
                          }
                        >
                          <XCircle size={15} />
                          Cancel
                        </button>
                      )}

                  </div>

                </div>

              </div>
            );
          })
        )}

      </div>
    </div>
  );
};

export default Orders;
