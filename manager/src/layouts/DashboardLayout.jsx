
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <Navbar />
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
