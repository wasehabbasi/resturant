import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RefreshCw, ClipboardList, ArrowLeft } from "lucide-react";
import api from "../services/api";

const statuses = [
    "pending",
    "accepted",
    "preparing",
    "ready",
    "completed",
];

const MyOrders = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const guestId = sessionStorage.getItem(
        `restaurant_guest_${token}`
    );

    const fetchOrders = async () => {
        if (!guestId) {
            setOrders([]);
            setLoading(false);
            return;
        }

        try {
            const response = await api.get(
                `/menu/${token}/my-orders`,
                { params: { guestId } }
            );

            setOrders(response.data.orders || []);
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your orders"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        const interval = setInterval(fetchOrders, 5000);

        return () => clearInterval(interval);
    }, [token]);

    const formatDate = (date) =>
        new Date(date).toLocaleString("en-PK");

    const statusColor = {
        pending: "#d97706",
        accepted: "#2563eb",
        preparing: "#9333ea",
        ready: "#0891b2",
        completed: "#16a34a",
        cancelled: "#dc2626",
    };

    const getProgress = (status) =>
        statuses.indexOf(status);

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <button
                    onClick={() => navigate(`/menu/${token}`)}
                    style={styles.back}
                >
                    <ArrowLeft size={17} /> Back to Menu
                </button>

                <div style={styles.header}>
                    <ClipboardList size={27} />
                    <div>
                        <h1>My Orders</h1>
                        <p>Track your restaurant orders</p>
                    </div>
                </div>

                {loading ? (
                    <p>Loading your orders...</p>
                ) : error ? (
                    <div style={styles.empty}>
                        <p>{error}</p>
                        <button onClick={fetchOrders}>
                            Retry
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={styles.empty}>
                        <ClipboardList size={40} />
                        <h3>No orders found</h3>
                        <p>Your orders will appear here.</p>
                        <button
                            onClick={() => navigate(`/menu/${token}`)}
                        >
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    orders.map((order) => {
                        const progress = getProgress(order.status);
                        const cancelled = order.status === "cancelled";

                        return (
                            <article
                                key={order.id}
                                style={styles.card}
                            >
                                <div style={styles.orderHeader}>
                                    <div>
                                        <strong>
                                            {order.orderNumber}
                                        </strong>
                                        <p>{formatDate(order.createdAt)}</p>
                                    </div>

                                    <span style={{
                                        ...styles.badge,
                                        color: statusColor[order.status] || "#555",
                                    }}>
                                        {order.status}
                                    </span>
                                </div>

                                {!cancelled && (
                                    <div style={styles.progress}>
                                        {statuses.map((status, index) => (
                                            <div
                                                key={status}
                                                style={styles.progressStep}
                                            >
                                                <div style={{
                                                    ...styles.dot,
                                                    background:
                                                        index <= progress
                                                            ? "#16a34a"
                                                            : "#ddd",
                                                }} />

                                                <small>{status}</small>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {cancelled && (
                                    <p style={{ color: "#dc2626" }}>
                                        This order was cancelled.
                                    </p>
                                )}

                                {(order.OrderItems || []).map((item) => (
                                    <div
                                        key={item.id}
                                        style={styles.item}
                                    >
                                        <span>
                                            {item.Product?.name || "Food"} × {item.quantity}
                                        </span>
                                        <strong>
                                            Rs. {Number(item.subtotal).toLocaleString("en-PK")}
                                        </strong>
                                    </div>
                                ))}

                                <div style={styles.total}>
                                    <strong>Order Total</strong>
                                    <strong>
                                        Rs. {Number(order.totalAmount).toLocaleString("en-PK")}
                                    </strong>
                                </div>
                            </article>
                        );
                    })
                )}

                <p style={styles.refresh}>
                    <RefreshCw size={13} />
                    Automatically refreshes every 5 seconds
                </p>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f7f7f7",
        padding: "25px 15px",
    },
    container: {
        maxWidth: "750px",
        margin: "auto",
    },
    back: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        border: "none",
        background: "transparent",
        color: "#a67c32",
        cursor: "pointer",
        fontWeight: "bold",
        marginBottom: "25px",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginBottom: "25px",
    },
    card: {
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: "13px",
        padding: "20px",
        marginBottom: "17px",
    },
    orderHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "20px",
    },
    badge: {
        fontWeight: "bold",
        textTransform: "capitalize",
    },
    progress: {
        display: "flex",
        justifyContent: "space-between",
        gap: "4px",
        marginBottom: "22px",
    },
    progressStep: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "7px",
        flex: 1,
        textTransform: "capitalize",
        fontSize: "10px",
    },
    dot: {
        width: "13px",
        height: "13px",
        borderRadius: "50%",
    },
    item: {
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
        padding: "10px 0",
        borderBottom: "1px solid #eee",
    },
    total: {
        display: "flex",
        justifyContent: "space-between",
        paddingTop: "15px",
    },
    empty: {
        textAlign: "center",
        padding: "50px 15px",
        background: "#fff",
        borderRadius: "12px",
    },
    refresh: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "7px",
        color: "#888",
        fontSize: "12px",
        marginTop: "20px",
    },
};

export default MyOrders;