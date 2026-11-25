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

import { useTranslation } from "react-i18next";

const statuses = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

const statusLabels = {
  pending: "pending",
  accepted: "accepted",
  preparing: "preparing",
  ready: "ready",
  completed: "completed",
  cancelled: "cancelled",
};

const nextStatus = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

const actionLabels = {
  accepted: "acceptOrder",
  preparing: "startPreparing",
  ready: "markReady",
  completed: "completeOrder",
};

const Orders = () => {
  const { t } = useTranslation();
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

  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [amountReceived, setAmountReceived] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [paymentHistory, setPaymentHistory] = useState([]);

  const [receiptData, setReceiptData] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");

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

  const submitCashPayment = async (e) => {
    e.preventDefault();

    if (!paymentOrder || !paymentSummary) return;

    try {
      setPaymentSaving(true);
      setError("");
      setMessage("");

      const amount = Number(paymentAmount);
      const received = Number(amountReceived);
      const remaining = Number(paymentSummary.remainingAmount);

      if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) {
        setError("Enter a valid payment amount within the remaining balance.");
        return;
      }

      if (!Number.isFinite(received) || received < amount) {
        setError("Cash received must be at least the payment amount.");
        return;
      }

      const response = await api.post(
              `/payments/${paymentOrder.id}/cash`,
              {
                amount,
                amountReceived: received,
              }
            );

            setMessage(
              `Payment received successfully. Change: Rs. ${formatPrice(
                response.data.summary.changeAmount
              )}`
            );

            const updatedPayment = await api.get(
        `/payments/${paymentOrder.id}`
      );

      setPaymentSummary(updatedPayment.data.summary);
      setPaymentHistory(updatedPayment.data.payments || []);
      setAmountReceived("");

      setPaymentAmount("");

      await fetchOrders();
          } catch (err) {
            console.error("CASH PAYMENT ERROR:", err);

            setError(
              err.response?.data?.message ||
              "Unable to record cash payment."
            );
          } finally {
            setPaymentSaving(false);
          }
        };

  const openPaymentModal = async (order) => {
    try {
      setPaymentOrder(order);
      setPaymentSummary(null);
      setPaymentHistory([]);
      setAmountReceived("");
      setPaymentLoading(true);
      setError("");

      const response = await api.get(`/payments/${order.id}`);

      setPaymentSummary(response.data.summary);
      setPaymentHistory(response.data.payments || []);
    } catch (err) {
      console.error("PAYMENT SUMMARY ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load payment details."
      );

      setPaymentOrder(null);
    } finally {
      setPaymentLoading(false);
    }
  };

  const openReceipt = async (orderId) => {
    try {
      setReceiptLoading(true);
      setError("");

      const response = await api.get(
        `/payments/${orderId}/receipt`
      );

      console.log("RECEIPT API RESPONSE:", response.data);

      setReceiptData(response.data.receipt);
    } catch (err) {
      console.error("RECEIPT ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load receipt."
      );
    } finally {
      setReceiptLoading(false);
    }
  };

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
        t("orders.statusUpdated", {
          status: t(`orders.${statusLabels[status]}`),
        })
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
        <p>	{t("orders.loading")}</p>
      </div>
    );
  }

  return (
    <div className="orders-page">

      {/* PAGE HEADER */}
      <div className="orders-header">
        <div>
          <h1>{t("orders.title")}</h1>
          <p>
            {t("orders.description")}
          </p>
        </div>

        <button
          type="button"
          className={`orders-sound-btn ${soundEnabled ? "sound-enabled" : ""
            }`}
          onClick={toggleSoundAlerts}
        >
          {soundReady
            ? t("orders.soundOn")
            : soundEnabled
              ? t("orders.activateSound")
              : t("orders.enableSound")}
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
          {t("orders.refresh")}
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
            <span>{t("orders.totalOrders")}</span>
            <h2>{orders.length}</h2>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon orange">
            <Clock size={22} />
          </div>
          <div>
            <span>{t("orders.pending")}</span>
            <h2>{countStatus("pending")}</h2>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon blue">
            <ChefHat size={22} />
          </div>
          <div>
            <span>{t("orders.preparing")}</span>
            <h2>{countStatus("preparing")}</h2>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon green">
            <CheckCircle size={22} />
          </div>
          <div>
            <span>{t("orders.completed")}</span>
            <h2>{countStatus("completed")}</h2>
          </div>
        </div>

      </div>

      {/* REVENUE */}
      <div className="orders-revenue">
        <div>
          <span>{t("orders.revenue")}</span>
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
            placeholder={t("orders.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">{t("orders.allOrders")}</option>

          {statuses.map((status) => (
            <option key={status} value={status}>
              {t(`orders.${statusLabels[status]}`)}
            </option>
          ))}
        </select>

      </div>

      {/* ORDER LIST */}
      <div className="orders-list">

        <div className="orders-list-heading">
          <div>
            <h2>{t("orders.restaurantOrders")}</h2>
            <p>{t("orders.ordersFound", { count: filteredOrders.length })}</p>
          </div>

          <span className="orders-live">
            ● {t("orders.autoRefresh")}
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <Package size={48} />

            <h3>{t("orders.noOrders")}</h3>

            <p>{t("orders.customerOrders")}</p>
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
                    {t(`orders.${statusLabels[order.status]}`) || order.status}
                  </span>

                </div>

                {/* CUSTOMER INFORMATION */}
                <div className="order-customer-info">

                  <div>
                    <span>{t("orders.customerLabel")}</span>
                    <strong>
                      {order.customerName || t("orders.guest")}
                    </strong>
                  </div>

                  <div>
                    <span>{t("orders.tableLabel")}</span>
                    <strong>
                      {order.RestaurantTable?.tableNumber || t("orders.notAvailable")}
                    </strong>
                  </div>

                  <div>
                    <span>{t("orders.orderId")}</span>
                    <strong>#{order.id}</strong>
                  </div>

                </div>

                {/* ORDER ITEMS */}
                <div className="order-items">

                  <h4>{t("orders.orderedItems")}</h4>

                  {items.length === 0 ? (
                    <p>{t("orders.noItemsFound")}</p>
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
                    <span>{t("orders.subtotalLabel")}</span>
                    <p>Rs. {formatPrice(order.subtotal)}</p>

                    <span>
                      Discount ({Number(order.discountRate || 0)}%)
                    </span>
                    <p style={{ color: "green" }}>
                      - Rs. {formatPrice(order.discountAmount)}
                    </p>

                    <span>Tax ({Number(order.taxRate || 0)}%)</span>
                    <p>Rs. {formatPrice(order.taxAmount)}</p>

                    <span>
                      Service Charge ({Number(order.serviceChargeRate || 0)}%)
                    </span>
                    <p>Rs. {formatPrice(order.serviceChargeAmount)}</p>

                    <span>{t("orders.grandTotalLabel")}</span>
                    <h3>Rs. {formatPrice(order.totalAmount)}</h3>
                  </div>


                  <div className="order-actions">

                    <button
                      type="button"
                      className="next-status-btn"
                      onClick={() => openPaymentModal(order)}
                    >
                      {t("orders.recordPayment")}
                    </button>

                    <button
                      type="button"
                      onClick={() => openReceipt(order.id)}
                      disabled={receiptLoading}
                    >
                      {receiptLoading
                        ? t("orders.loadingReceipt")
                        : t("orders.viewReceipt")}
                    </button>

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
                          : t(`orders.${actionLabels[next]}`)}
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
                          {t("orders.cancel")}
                        </button>
                      )}

                  </div>

                </div>

              </div>
            );
          })
        )}

      </div>

      {paymentOrder && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <div>
                <h2>{t("orders.recordCashPayment")}</h2>
                <p>{t("orders.order")}: {paymentOrder.orderNumber}</p>
              </div>

              <button
                type="button"
                onClick={() => setPaymentOrder(null)}
                className="payment-close-btn"
              >
                <XCircle size={22} />
              </button>
            </div>

            {paymentLoading ? (
              <p>{t("orders.loadingPaymentDetails")}</p>
            ) : paymentSummary && (
              <>
                <div className="payment-summary">
                  <div>
                    <span>{t("orders.orderTotal")}</span>
                    <strong>Rs. {formatPrice(paymentSummary.orderTotal)}</strong>
                  </div>

                  <div>
                    <span>{t("orders.totalPaid")}</span>
                    <strong>Rs. {formatPrice(paymentSummary.totalPaid)}</strong>
                  </div>

                  <div>
                    <span>{t("orders.remaining")}</span>
                    <strong>
                      Rs. {formatPrice(paymentSummary.remainingAmount)}
                    </strong>
                  </div>
                </div>

                {Number(paymentSummary.remainingAmount) <= 0 ? (
                  <div className="payment-fully-paid">
                    {t("orders.fullyPaid")}
                  </div>
                ) : (
                  <form onSubmit={submitCashPayment}>
                    <label htmlFor="paymentAmount">
                      {t("orders.amountToPay")}
                    </label>

                    <input
                      id="paymentAmount"
                      type="number"
                      min="0.01"
                      max={paymentSummary.remainingAmount}
                      step="0.01"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={t("orders.enterAmount")}
                    />

                    <label htmlFor="amountReceived">
                      {t("orders.cashReceived")}
                    </label>

                    <input
                      id="amountReceived"
                      type="number"
                      min={paymentAmount || "0.01"}
                      step="0.01"
                      required
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder={t("orders.enterCash")}
                    />

                    <p className="payment-hint">
                      {t("orders.remainingBalance")}: Rs. {formatPrice(paymentSummary.remainingAmount)}
                    </p>

                    <p className="payment-hint">
                      {t("orders.amountDue")}: Rs. {formatPrice(paymentSummary.remainingAmount)}
                    </p>

                    <button
                      type="submit"
                      className="payment-submit-btn"
                      disabled={paymentSaving}
                    >
                      {paymentSaving ? t("orders.saving") : t("orders.confirmCashPayment")}
                    </button>
                  </form>
                )}

                <div className="payment-history">
                  <h3>{t("orders.paymentHistory")}</h3>

                  {paymentHistory.length === 0 ? (
                    <p>{t("orders.noPayments")}</p>
                  ) : (
                    paymentHistory.map((payment) => (
                      <div className="payment-history-row" key={payment.id}>
                        <div>
                          <strong>
                            Rs. {formatPrice(payment.amount)}
                          </strong>
                          <span>
                            {payment.paymentMethod} · {payment.status}
                          </span>
                          <span>{formatDate(payment.createdAt)}</span>
                        </div>

                        <div>
                          <span>
                            Received: Rs. {formatPrice(payment.amountReceived)}
                          </span>
                          <span>
                            Change: Rs. {formatPrice(payment.changeAmount)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      
{receiptData && (
  <div className="modal-overlay receipt-overlay">
    <div className="receipt-modal">
      <div id="print-receipt">
        <div className="receipt-header">
          <h2>{t("orders.receiptTitle")}</h2>
          <p>{t("orders.paymentReceipt")}</p>
        </div>

        <hr />

        <p>
          <strong>{t("orders.order")}:</strong>{" "}
          {receiptData.order.orderNumber}
        </p>

        <p>
          <strong>{t("orders.date")}:</strong>{" "}
          {new Date(receiptData.order.createdAt).toLocaleString()}
        </p>

        <p>
          <strong>{t("orders.customer")}:</strong>{" "}
          {receiptData.order.customerName || t("orders.walkInCustomer")}
        </p>

        <p>
          <strong>{t("orders.table")}:</strong>{" "}
          {receiptData.order.RestaurantTable?.tableNumber || "N/A"}
        </p>

        <hr />

        <h3>{t("orders.orderItems")}</h3>

        <table>
          <thead>
            <tr>
              <th>{t("orders.item")}</th>
              <th>{t("orders.quantity")}</th>
              <th>{t("orders.price")}</th>
              <th>{t("orders.total")}</th>
            </tr>
          </thead>

          <tbody>
            {(receiptData.order.OrderItems || []).map((item) => (
              <tr key={item.id}>
                <td>{item.Product?.name || "Product"}</td>
                <td>{item.quantity}</td>
                <td>Rs. {formatPrice(item.price)}</td>
                <td>Rs. {formatPrice(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />

        <div className="receipt-totals">
          <p>
            {t("orders.subtotal")}:{" "}
            <strong>Rs. {formatPrice(receiptData.order.subtotal)}</strong>
          </p>

          <p>
            {t("orders.discount")} ({Number(receiptData.order.discountRate || 0)}%):
            <strong style={{ color: "green" }}>
              - Rs. {formatPrice(receiptData.order.discountAmount)}
            </strong>
          </p>

          <p>
            {t("orders.tax")} ({Number(receiptData.order.taxRate || 0)}%):
            <strong>Rs. {formatPrice(receiptData.order.taxAmount)}</strong>
          </p>

          <p>
            {t("orders.serviceCharge")} ({Number(receiptData.order.serviceChargeRate || 0)}%):
            <strong>Rs. {formatPrice(receiptData.order.serviceChargeAmount)}</strong>
          </p>

          <p>
            {t("orders.grandTotal")}:
            <strong>Rs. {formatPrice(receiptData.orderTotal)}</strong>
          </p>

          <p>
            {t("orders.paid")}:{" "}
            <strong>Rs. {formatPrice(receiptData.totalPaid)}</strong>
          </p>

          <p>
            {t("orders.remaining")}:{" "}
            <strong>Rs. {formatPrice(receiptData.remainingAmount)}</strong>
          </p>
        </div>

        <hr />

        <h3>{t("orders.paymentHistory")}</h3>

        {(receiptData.payments || []).map((payment) => (
          <p key={payment.id}>
            {payment.paymentMethod.toUpperCase()} — {payment.status.toUpperCase()}
            <br />
            Rs. {formatPrice(payment.amount)}
          </p>
        ))}

        <div className="receipt-footer">
          <p>{t("orders.thankYou")}</p>
        </div>
      </div>

      <div className="receipt-actions">
        <button onClick={() => window.print()}>
          {t("orders.printReceipt")}
        </button>

        <button onClick={() => setReceiptData(null)}>
          {t("orders.close")}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Orders;
