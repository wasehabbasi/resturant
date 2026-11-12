
import { useEffect, useState } from "react";
import { Bell, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import "./NotificationHistory.css";

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async (currentPage = page) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/notifications?page=${currentPage}&limit=20`
      );

      setNotifications(response.data.notifications || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error("NOTIFICATION HISTORY ERROR:", err);
      setError(
        err.response?.data?.message ||
        "Unable to load notification history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  return (
    <div className="notification-history-page">
      <div className="notification-history-header">
        <div>
          <h1>Notification History</h1>
          <p>View all notifications for your selected branch.</p>
        </div>

        <button
          type="button"
          onClick={() => fetchNotifications(page)}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="notification-history-error">
          {error}
        </div>
      )}

      <div className="notification-history-list">
        {loading ? (
          <p className="notification-history-empty">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <div className="notification-history-empty">
            <Bell size={35} />
            <h3>No notifications yet</h3>
            <p>New notifications will appear here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-history-item ${
                notification.isRead ? "read" : "unread"
              }`}
            >
              <div className="notification-history-icon">
                <Bell size={19} />
              </div>

              <div className="notification-history-content">
                <div className="notification-history-title">
                  <strong>{notification.title}</strong>
                  <span className={notification.isRead ? "read-label" : "unread-label"}>
                    {notification.isRead ? "Read" : "Unread"}
                  </span>
                </div>

                <p>{notification.message}</p>

                <small>
                  {new Date(notification.createdAt).toLocaleString("en-PK")}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="notification-history-pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((previous) => previous - 1)}
          >
            <ChevronLeft size={17} />
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((previous) => previous + 1)}
          >
            Next
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;
