
import "./Sidebar.css";
import { NavLink } from "react-router-dom";
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
} from "lucide-react";

const Sidebar = ({ restaurant }) => {
  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Orders", path: "/orders", icon: ShoppingBag },
    { name: "Products", path: "/products", icon: Utensils },
    { name: "Categories", path: "/categories", icon: Tags },
    { name: "Tables & QR", path: "/tables", icon: Table2 },
    { name: "Reports", path: "/reports", icon: BarChart3 },
    { name: "Branches", path: "/branches", icon: GitBranch },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

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
          <span>Management Panel</span>
        </div>
      </div>

      <p className="menu-label">MAIN MENU</p>

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
              <span>{item.name}</span>
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
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
