
import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Tags,
  Table2,
  LogOut,
  Store,
  BarChart3,
  GitBranch,
  Settings,
  ChefHat,
  Bell,
  Package,
  Receipt,
  CalendarDays,
  Users,
} from "lucide-react";

const getCurrentUser = () => {
  const userData =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  try {
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const Sidebar = ({ restaurant }) => {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const role = user?.role;

  const allMenuItems = [
    { key: "dashboard", path: "/", icon: LayoutDashboard },
    { key: "orders", path: "/orders", icon: ShoppingBag },
    { key: "kitchen", path: "/kitchen", icon: ChefHat },
    { key: "products", path: "/products", icon: Utensils },
    { key: "inventory", path: "/inventory", icon: Package },
    { key: "categories", path: "/categories", icon: Tags },
    { key: "tables", path: "/tables", icon: Table2 },
    { key: "reports", path: "/reports", icon: BarChart3 },
    { key: "branches", path: "/branches", icon: GitBranch },
    { key: "settings", path: "/settings", icon: Settings },
    { key: "notifications", path: "/notifications", icon: Bell },
    { key: "expenses", path: "/expenses", icon: Receipt },
    { key: "reservations", path: "/reservations", icon: CalendarDays },
    { key: "customers", path: "/customers", icon: Users },
  ];

  const roleMenus = {
    manager: allMenuItems,
    admin: allMenuItems,
    cashier: allMenuItems.filter(item =>
      ["/", "/orders", "/notifications"].includes(item.path)
    ),
    waiter: allMenuItems.filter(item =>
      ["/", "/orders", "/notifications"].includes(item.path)
    ),
    kitchen: allMenuItems.filter(item =>
      ["/", "/kitchen", "/notifications"].includes(item.path)
    ),
  };

  const menuItems = roleMenus[role] || [];

  const logoUrl = restaurant?.logo
    ? restaurant.logo.startsWith("http")
      ? restaurant.logo
      : `http://localhost:5000${restaurant.logo}`
    : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={restaurant?.name || "Restaurant"}
            className="sidebar-restaurant-logo"
          />
        ) : (
          <div className="logo-icon">
            <Store size={23} />
          </div>
        )}

        <div>
          <h2>{restaurant?.name || "Restaurant"}</h2>
          <span>{t("sidebar.managementPanel")}</span>
        </div>
      </div>

      <p className="menu-label">{t("sidebar.mainMenu")}</p>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive ? "menu-item active" : "menu-item"
              }
            >
              <Icon size={19} />
              <span>{t(`sidebar.${item.key}`)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          <LogOut size={19} />
          {t("sidebar.logout")}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
