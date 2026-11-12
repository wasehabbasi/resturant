
import { useEffect, useState } from "react";
import { Bell, Search, UserCircle, GitBranch } from "lucide-react";
import { io } from "socket.io-client";
import api from "../services/api";
import "./Navbar.css";

const Navbar = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchError, setBranchError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
const [showNotifications, setShowNotifications] = useState(false);

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

  useEffect(() => {
  if (!selectedBranch) return;

  const storage = localStorage.getItem("token")
    ? localStorage
    : sessionStorage;

  const token = storage.getItem("token");

  if (!token) return;

  let active = true;

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");

      if (active) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("UNREAD NOTIFICATION ERROR:", error);
    }
  };

  fetchUnreadCount();

  const socket = io("http://localhost:5000", {
    auth: {
      token,
      branchId: selectedBranch,
    },
  });

  socket.on("notification:new", (notification) => {
  setUnreadCount((previous) => previous + 1);

  setNotifications((previous) => [
    notification,
    ...previous.filter((item) => item.id !== notification.id),
  ].slice(0, 20));
});

  socket.on("connect_error", (error) => {
    console.error("NOTIFICATION SOCKET ERROR:", error.message);
  });

  return () => {
    active = false;
    socket.disconnect();
  };
}, [selectedBranch]);

const handleNotificationToggle = async () => {
  const willOpen = !showNotifications;
  setShowNotifications(willOpen);

  if (!willOpen) return;

  try {
    const response = await api.get("/notifications?limit=20");
    setNotifications(response.data.notifications || []);
  } catch (error) {
    console.error("NOTIFICATIONS ERROR:", error);
  }
};

const handleMarkAsRead = async (notification) => {
  if (notification.isRead) return;

  try {
    await api.patch(`/notifications/${notification.id}/read`);

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id
          ? { ...item, isRead: true }
          : item
      )
    );

    setUnreadCount((previous) => Math.max(0, previous - 1));
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);
  }
};

const handleMarkAllAsRead = async () => {
  try {
    await api.patch("/notifications/read-all");

    setNotifications((previous) =>
      previous.map((item) => ({ ...item, isRead: true }))
    );

    setUnreadCount(0);
  } catch (error) {
    console.error("MARK ALL READ ERROR:", error);
  }
};

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

        <div className="notification-wrapper">
  <button
    className="notification-button"
    type="button"
    title={`${unreadCount} unread notifications`}
    onClick={handleNotificationToggle}
  >
    <Bell size={21} />

    {unreadCount > 0 && (
      <span className="notification-count">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    )}
  </button>

  {showNotifications && (
    <div className="notification-dropdown">
      <div className="notification-header">
        <strong>Notifications</strong>

        <button
          type="button"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <p className="notification-empty">
            No notifications yet
          </p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${
                notification.isRead ? "read" : "unread"
              }`}
              onClick={() => handleMarkAsRead(notification)}
            >
              <strong>{notification.title}</strong>

              <p>{notification.message}</p>

              <small>
                {new Date(notification.createdAt).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  )}
</div>

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
