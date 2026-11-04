
import { Bell, Search, UserCircle } from "lucide-react";
import "./Navbar.css";

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-search">
        <Search size={19} />
        <input
          type="text"
          placeholder="Search anything..."
        />
      </div>

      <div className="navbar-right">
        <button className="notification-button">
          <Bell size={21} />
          <span className="notification-dot"></span>
        </button>

        <div className="profile-info">
          <UserCircle size={35} color="#f97316" />

          <div>
            <h4>Restaurant Manager</h4>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
