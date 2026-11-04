
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Checkout = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const {
    cart,
    totalPrice,
    totalItems,
  } = useCart();

  return (
    <div className="checkout-page">

      <button onClick={() => navigate(`/menu/${token}`)}>
        ← Back to Menu
      </button>

      <h1>Checkout</h1>
      <p>Review your restaurant order</p>

      <div className="checkout-box">
        {cart.map((item) => (
          <div className="checkout-item" key={item.id}>
            <span>
              {item.name} × {item.quantity}
            </span>

            <strong>
              Rs. {(item.price * item.quantity).toLocaleString("en-PK")}
            </strong>
          </div>
        ))}

        <hr />

        <div className="checkout-total">
          <strong>Total Items: {totalItems}</strong>
          <strong>
            Rs. {totalPrice.toLocaleString("en-PK")}
          </strong>
        </div>

        <p className="checkout-note">
          Order submission will be enabled in Prompt 9.
        </p>
      </div>

    </div>
  );
};

export default Checkout;
