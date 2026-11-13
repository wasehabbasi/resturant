import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Tables from "./pages/Tables";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Register from "./pages/Register";
import Branches from "./pages/Branches";
import Settings from "./pages/Settings";
import Kitchen from "./pages/Kitchen";
import NotificationHistory from "./pages/NotificationHistory";

const getSession = () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const userData =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  if (!token || !userData) return null;

  try {
    const user = JSON.parse(userData);

    if (!["manager", "admin", "cashier", "waiter", "kitchen"].includes(user.role)) {
      return null;
    }

    return { token, user };
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const session = getSession();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const Placeholder = ({ title }) => (
  <div style={{ padding: "20px" }}>
    <h1>{title}</h1>
    <p>This section will be developed in upcoming steps.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />


        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />


        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Orders />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <NotificationHistory />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Kitchen />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Products />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Categories />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tables"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Tables />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/branches"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Branches />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
