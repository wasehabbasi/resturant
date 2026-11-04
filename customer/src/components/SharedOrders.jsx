
import { useEffect, useState } from "react";
import { RefreshCw, ClipboardList } from "lucide-react";
import api from "../services/api";

const SharedOrders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [combinedTotal, setCombinedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchOrders = async () => {
      try {
        const response = await api.get(
          `/menu/${token}/orders`
        );

        if (!active) return;

        setOrders(response.data.orders || []);
        setCombinedTotal(
          Number(response.data.combinedTotal || 0)
        );
        setError("");
      } catch (err) {
        if (active) {
          setError("Unable to load table orders");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrders();

    const interval = setInterval(fetchOrders, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token]);

  const statusColors = {
    pending: "#d97706",
    accepted: "#2563eb",
    preparing: "#9333ea",
    ready: "#059669",
  };

  return (
    <section
      style={{
        marginTop: "45px",
        padding: "24px",
        background: "#fff",
        borderRadius: "14px",
        border: "1px solid #e8e8e8",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            <ClipboardList
              size={20}
              style={{
                verticalAlign: "middle",
                marginRight: "8px",
              }}
            />
            Table's Shared Orders
          </h2>

          <p style={{ color: "#888", fontSize: "13px" }}>
            Orders placed by everyone at this table
          </p>
        </div>

        <span
          style={{
            color: "#16834c",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          ● Live updates
        </span>
      </div>

      {loading ? (
        <p>Loading table orders...</p>
      ) : error ? (
        <p style={{ color: "#dc2626" }}>{error}</p>
      ) : orders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "25px",
            color: "#888",
          }}
        >
          <ClipboardList size={35} />
          <p>No orders placed at this table yet.</p>
        </div>
      ) : (
        <>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                padding: "17px",
                border: "1px solid #eee",
                borderRadius: "10px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <strong>{order.customerName || "Customer"}</strong>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      margin: "5px 0",
                    }}
                  >
                    {order.orderNumber}
                  </p>
                </div>

                <span
                  style={{
                    color:
                      statusColors[order.status] || "#555",
                    fontWeight: "bold",
                    fontSize: "13px",
                    textTransform: "capitalize",
                  }}
                >
                  {order.status}
                </span>
              </div>

              {(order.OrderItems || []).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    fontSize: "14px",
                  }}
                >
                  <span>
                    {item.Product?.name || "Food item"} ×{" "}
                    {item.quantity}
                  </span>

                  <strong>
                    Rs. {Number(item.subtotal).toLocaleString("en-PK")}
                  </strong>
                </div>
              ))}

              <div
                style={{
                  borderTop: "1px solid #eee",
                  paddingTop: "10px",
                  textAlign: "right",
                }}
              >
                <strong>
                  Order Total: Rs.{" "}
                  {Number(order.totalAmount).toLocaleString("en-PK")}
                </strong>
              </div>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "17px",
              background: "#f8f5ee",
              borderRadius: "10px",
              fontWeight: "bold",
            }}
          >
            <span>Combined Table Bill</span>
            <span>
              Rs. {combinedTotal.toLocaleString("en-PK")}
            </span>
          </div>
        </>
      )}

      <p
        style={{
          fontSize: "11px",
          color: "#999",
          textAlign: "center",
          marginTop: "15px",
        }}
      >
        <RefreshCw
          size={12}
          style={{ verticalAlign: "middle" }}
        />{" "}
        Orders refresh automatically every 4 seconds.
      </p>
    </section>
  );
};

export default SharedOrders;
