
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";

const DEFAULT_THEME = {
  primary: "#171c1a",
  secondary: "#c99a43",
  accent: "#e0b45c",
};

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const response = await api.get("/restaurant");
        const data = response.data.restaurant;

        const parseTheme = (value) => {
          if (typeof value === "string") {
            try {
              return JSON.parse(value);
            } catch {
              return {};
            }
          }
          return value || {};
        };

        setRestaurant({
          ...data,
          portalTheme: {
            ...DEFAULT_THEME,
            ...parseTheme(data.portalTheme),
          },
        });
      } catch (error) {
        console.error("Restaurant branding error:", error);
      }
    };

    loadRestaurant();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("branchId");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("branchId");
    navigate("/login", { replace: true });
  };

  const theme = restaurant?.portalTheme || DEFAULT_THEME;

  const themeStyles = {
    "--portal-primary": theme.primary,
    "--portal-secondary": theme.secondary,
    "--portal-accent": theme.accent,
  };

  const userData =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  let user = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch {
    user = null;
  }

  return (
    <div className="dashboard-container" style={themeStyles}>
      <Sidebar restaurant={restaurant} />

      <main className="main-content">
        <Navbar />

        <div className="dashboard-user-bar">
          <span>
            Welcome, <strong>{user?.name || "Manager"}</strong>
          </span>

          <button onClick={handleLogout} className="dashboard-logout">
            Logout
          </button>
        </div>

        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
