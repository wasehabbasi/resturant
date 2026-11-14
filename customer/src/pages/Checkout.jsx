import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../services/api";

const Checkout = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const {
    cart,
    totalPrice,
    totalItems,
    clearCart,
    setCartScope,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    setCartScope(token);
  }, [token]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError("");

    if (customerName.trim().length < 2) {
      setError("Please enter your name");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    try {
      setLoading(true);

      // Each browser tab gets its own guest identity
      let guestId = sessionStorage.getItem(
        `restaurant_guest_${token}`
      );

      if (!guestId) {
        guestId =
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

        sessionStorage.setItem(
          `restaurant_guest_${token}`,
          guestId
        );
      }

      const response = await api.post(
        `/menu/${token}/orders`,
        {
          customerName: customerName.trim(),
          guestId,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }
      );

      setSuccess(response.data.order);
      clearCart();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to place order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "grid",
          placeItems: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            padding: "35px",
            background: "#fff",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 5px 25px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "55px" }}>✓</div>

          <h2>Order Placed Successfully!</h2>

          <p>
            Your order has been added to the shared table orders.
          </p>

          <strong>{success.orderNumber}</strong>

          <p>
            Total: Rs.{" "}
            {Number(success.totalAmount).toLocaleString("en-PK")}
          </p>

          <button
            onClick={() => navigate(`/menu/${token}`)}
            style={styles.button}
          >
            View Shared Table Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <button
          onClick={() => navigate(`/menu/${token}`)}
          style={styles.back}
        >
          ← Back to Menu
        </button>

        <h1>Checkout</h1>

        <p style={{ color: "#777" }}>
          Place your order for this shared restaurant table.
        </p>

        <form onSubmit={handlePlaceOrder}>
          <label style={styles.label}>
            Your Name
          </label>

          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={60}
            required
            style={styles.input}
          />

          <h3>Your Items</h3>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div style={styles.item} key={item.id}>
                <span>
                  {item.name} × {item.quantity}
                </span>

                <strong>
                  Rs.{" "}
                  {(item.price * item.quantity).toLocaleString("en-PK")}
                </strong>
              </div>
            ))
          )}

          <hr />

          <div style={styles.total}>
            <strong>Total Items: {totalItems}</strong>

            <strong>
              Rs. {totalPrice.toLocaleString("en-PK")}
            </strong>
          </div>

          {error && (
            <p style={styles.error}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            style={{
              ...styles.button,
              opacity: loading || cart.length === 0 ? 0.6 : 1,
            }}
          >
            {loading ? "Placing Order..." : "Confirm & Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f7f7",
    padding: "30px 15px",
    boxSizing: "border-box",
  },
  box: {
    maxWidth: "600px",
    margin: "auto",
    background: "#fff",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },
  back: {
    border: "none",
    background: "none",
    cursor: "pointer",
    color: "#a67c32",
    fontWeight: "bold",
  },
  label: {
    display: "block",
    marginTop: "25px",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "15px",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "12px 0",
    borderBottom: "1px solid #eee",
  },
  total: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "15px 0",
  },
  button: {
    width: "100%",
    padding: "15px",
    marginTop: "20px",
    background: "#c99a43",
    color: "#171c1a",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
  },
  error: {
    color: "#c62828",
    background: "#fff0ee",
    padding: "12px",
    borderRadius: "7px",
  },
};

export default Checkout;
