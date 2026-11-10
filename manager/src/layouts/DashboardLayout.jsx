import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("branchId");
    
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("branchId");

    navigate("/login", { replace: true });
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
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "15px",
            padding: "12px 24px",
            borderBottom: "1px solid #eee",
            background: "#fff",
          }}
        >
          <span style={{ fontSize: "13px", color: "#555" }}>
            Welcome, <strong>{user?.name || "Manager"}</strong>
          </span>

          <button
            onClick={handleLogout}
            style={{
              background: "#b9382d",
              color: "#fff",
              border: "none",
              borderRadius: "7px",
              padding: "10px 17px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </div>

        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
