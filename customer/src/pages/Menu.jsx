
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingBag, Search } from "lucide-react";

import api from "../services/api";
import { useCart } from "../context/CartContext";

import Header from "../components/Header";
import CategoryBar from "../components/CategoryBar";
import FoodCard from "../components/FoodCard";
import CartDrawer from "../components/CartDrawer";
import SharedOrders from "../components/SharedOrders";

const Menu = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const { addToCart, totalItems, totalPrice } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [branch, setBranch] = useState(null);
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/menu/${token}`);
        const data = response.data;

        setRestaurant(data.restaurant);
        setBranch(data.branch);
        setTable(data.table);
        setCategories(data.categories || []);
        setProducts(data.products || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load restaurant menu"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [token]);

  const theme = restaurant?.customerTheme || {};

  const primaryColor = theme.primaryColor || "#f97316";
  const secondaryColor = theme.secondaryColor || "#9a3412";
  const accentColor = theme.accentColor || "#fff0e5";
  const textColor = theme.textColor || "#292524";
  const backgroundColor = theme.backgroundColor || "#fffaf5";

  const themeStyles = {
    "--brand-primary": primaryColor,
    "--brand-secondary": secondaryColor,
    "--brand-accent": accentColor,
    "--brand-text": textColor,
    "--brand-background": backgroundColor,
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" ||
      Number(product.categoryId) === Number(activeCategory);

    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div className="page-message">Loading menu...</div>;
  }

  if (error) {
    return (
      <div className="page-message error-message">
        <h2>Menu Unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

  const handleCheckout = () => {
    navigate(`/checkout/${token}`);
  };

  return (
    <div className="customer-page" style={themeStyles}>
      <Header
        restaurant={restaurant}
        branch={branch}
        tableNumber={table.tableNumber}
        onCartClick={() => setCartOpen(true)}
      />

      <section className="menu-hero">
        <div>
          <span className="hero-tag">
            WELCOME TO {restaurant?.name || "OUR RESTAURANT"}
          </span>

          <h1>Discover Our Delicious Menu</h1>

          <p>
            Fresh food, great taste and unforgettable experience.
          </p>

          <span className="hero-table">
            <ShoppingBag size={16} />
            {branch?.name ? `${branch.name} · ` : ""}
            Ordering for Table {table.tableNumber}
          </span>
        </div>
      </section>

      <main className="menu-content">
        <SharedOrders token={token} />

        <div className="menu-title">
          <div>
            <h2>Our Menu</h2>
            <p>Choose your favourite food</p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/my-orders/${token}`)}
          style={{
            padding: "12px 18px",
            marginBottom: "20px",
            border: "1px solid var(--brand-primary)",
            background: "var(--brand-accent)",
            borderRadius: "8px",
            color: "var(--brand-primary)",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          My Orders
        </button>

        <div className="menu-search">
          <Search size={19} />
          <input
            placeholder="Search food items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <CategoryBar
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <div className="food-grid">
          {filteredProducts.map((product) => (
            <FoodCard
              key={product.id}
              product={product}
              onAdd={addToCart}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="empty-menu">
            <h3>No food items found</h3>
            <p>Try another category or search term.</p>
          </div>
        )}
      </main>

      {totalItems > 0 && (
        <button
          className="floating-cart"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag size={19} />
          View Cart ({totalItems})
          <strong>
            Rs. {totalPrice.toLocaleString("en-PK")}
          </strong>
        </button>
      )}

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default Menu;
