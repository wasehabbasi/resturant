
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

const CartDrawer = ({ isOpen, onClose, onCheckout }) => {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    totalPrice,
    totalItems,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cart-heading">
          <div>
            <h2>Your Cart</h2>
            <p>{totalItems} items selected</p>
          </div>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              Your cart is empty.
              <p>Add some delicious food!</p>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-info">
                  <h4>{item.name}</h4>

                  <strong>
                    Rs. {(item.price * item.quantity).toLocaleString("en-PK")}
                  </strong>

                  <div className="quantity-controls">
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                    >
                      <Minus size={14} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => increaseQuantity(item.id)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  className="remove-item"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total</span>
            <strong>
              Rs. {totalPrice.toLocaleString("en-PK")}
            </strong>
          </div>

          <button
            className="checkout-button"
            disabled={cart.length === 0}
            onClick={onCheckout}
          >
            Proceed to Checkout
          </button>
        </div>

      </div>
    </div>
  );
};

export default CartDrawer;
