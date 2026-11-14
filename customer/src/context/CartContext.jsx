import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [activeToken, setActiveToken] = useState(null);

  // Load cart belonging to the current QR table
  const setCartScope = (token) => {
    if (!token) return;

    try {
      const savedCart = localStorage.getItem(
        `restaurant_cart_${token}`
      );

      const parsedCart = savedCart
        ? JSON.parse(savedCart)
        : [];

      setCart(Array.isArray(parsedCart) ? parsedCart : []);
      setActiveToken(token);
    } catch (error) {
      console.error("CART RESTORE ERROR:", error);
      setCart([]);
      setActiveToken(token);
    }
  };

  // Automatically save cart whenever it changes
  useEffect(() => {
    if (!activeToken) return;

    localStorage.setItem(
      `restaurant_cart_${activeToken}`,
      JSON.stringify(cart)
    );
  }, [cart, activeToken]);

  const addToCart = (product, token) => {
    if (!token) return;

    if (activeToken !== token) {
      setCartScope(token);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          quantity: 1,
        },
      ];
    });
  };

  const increaseQuantity = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const clearCart = () => {
    setCart([]);

    if (activeToken) {
      localStorage.removeItem(
        `restaurant_cart_${activeToken}`
      );
    }
  };

  const totalItems = useMemo(
    () => cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    ),
    [cart]
  );

  const totalPrice = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        setCartScope,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
