
import { ShoppingBag, Utensils } from "lucide-react";
import { useCart } from "../context/CartContext";

const Header = ({ tableNumber, onCartClick }) => {
  const { totalItems } = useCart();

  return (
    <header className="customer-header">
      <div className="brand">
        <div className="brand-icon">
          <Utensils size={22} />
        </div>

        <div>
          <h2>Food Corner</h2>
          <span>Digital Restaurant Menu</span>
        </div>
      </div>

      <div className="header-right">
        <span className="table-number">
          Table {tableNumber}
        </span>

        <button
          className="cart-button"
          onClick={onCartClick}
        >
          <ShoppingBag size={20} />
          Cart
          <span className="cart-count">
            {totalItems}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
