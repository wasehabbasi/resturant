
import { ShoppingBag, Utensils } from "lucide-react";
import { useCart } from "../context/CartContext";

const Header = ({
  restaurant,
  branch,
  tableNumber,
  onCartClick,
}) => {
  const { totalItems } = useCart();

  return (
    <header className="customer-header">
      <div className="brand">
        {restaurant?.logo ? (
          <img
            src={
              restaurant.logo.startsWith("http")
                ? restaurant.logo
                : `${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "")}${restaurant.logo}`
            }
            alt={restaurant?.name || "Restaurant"}
            className="restaurant-logo"
          />
        ) : (
          <div className="brand-icon">
            <Utensils size={22} />
          </div>
        )}

        <div>
          <h2>{restaurant?.name || "Restaurant"}</h2>
          <span>{branch?.name || "Digital Restaurant Menu"}</span>
        </div>
      </div>

      <div className="header-right">
        <span className="table-number">
          Table {tableNumber}
        </span>

        <button className="cart-button" onClick={onCartClick}>
          <ShoppingBag size={20} />
          Cart
          <span className="cart-count">{totalItems}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
