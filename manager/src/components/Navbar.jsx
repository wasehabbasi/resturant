
import { useEffect, useState } from "react";
import { Bell, Search, UserCircle, GitBranch } from "lucide-react";
import api from "../services/api";
import "./Navbar.css";

const Navbar = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchError, setBranchError] = useState("");

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoadingBranches(true);

        const response = await api.get("/branches");
        const activeBranches = (response.data.branches || []).filter(
          (branch) => branch.isActive
        );

        setBranches(activeBranches);

        if (activeBranches.length === 0) {
          setBranchError("No active branch available");
          return;
        }

        const savedBranchId =
          localStorage.getItem("currentBranchId") ||
          sessionStorage.getItem("currentBranchId");

        const savedBranch = activeBranches.find(
          (branch) => String(branch.id) === String(savedBranchId)
        );

        const defaultBranch = activeBranches.find(
          (branch) => branch.isDefault
        );

        const initialBranch =
          savedBranch || defaultBranch || activeBranches[0];

        setSelectedBranch(String(initialBranch.id));

        if (!savedBranch) {
          const storage = localStorage.getItem("token")
            ? localStorage
            : sessionStorage;

          storage.setItem("currentBranchId", String(initialBranch.id));
        }
      } catch (error) {
        setBranchError(
          error.response?.data?.message || "Unable to load branches"
        );
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, []);

  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    if (!branchId) return;

    const storage = localStorage.getItem("token")
      ? localStorage
      : sessionStorage;

    storage.setItem("currentBranchId", branchId);
    setSelectedBranch(branchId);

    // Reload current page so its data is fetched for the new branch
    window.location.reload();
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
    <header className="navbar">
      <div className="navbar-search">
        <Search size={19} />
        <input type="text" placeholder="Search anything..." />
      </div>

      <div className="navbar-right">
        <div className="branch-selector">
          <GitBranch size={18} />
          <select
            value={selectedBranch}
            onChange={handleBranchChange}
            disabled={loadingBranches || branches.length === 0}
          >
            {loadingBranches && <option>Loading branches...</option>}

            {!loadingBranches && branches.length === 0 && (
              <option value="">No active branches</option>
            )}

            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}{branch.isDefault ? " (Default)" : ""}
              </option>
            ))}
          </select>
        </div>

        {branchError && (
          <span className="branch-error" title={branchError}>
            Branch unavailable
          </span>
        )}

        <button className="notification-button">
          <Bell size={21} />
          <span className="notification-dot"></span>
        </button>

        <div className="profile-info">
          <UserCircle
            size={35}
            color="var(--portal-primary, #171c1a)"
          />

          <div>
            <h4>{user?.name || "Restaurant Manager"}</h4>
            <span>{user?.role || "Manager"}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
