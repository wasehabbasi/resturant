
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { CartProvider } from "./context/CartContext";

import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>

          <Route
            path="/menu/:token"
            element={<Menu />}
          />

          <Route
            path="/checkout/:token"
            element={<Checkout />}
          />

          <Route
            path="/my-orders/:token"
            element={<MyOrders />}
          />

          <Route
            path="/"
            element={<div>Scan restaurant QR code to view menu.</div>}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
