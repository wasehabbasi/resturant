
import { useEffect, useState } from "react";
import { Bell, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import "./NotificationHistory.css";
import { useTranslation } from "react-i18next";

const NotificationHistory = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "ur" ? "ur-PK" : "en-PK";
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
        t("notificationHistory.loadError")
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
          <h1>{t("notificationHistory.title")}</h1>
          <p>{t("notificationHistory.description")}</p>
        </div>

        <button
          type="button"
          onClick={() => fetchNotifications(page)}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {t("notificationHistory.refresh")}
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
            {t("notificationHistory.loading")}
          </p>
        ) : notifications.length === 0 ? (
          <div className="notification-history-empty">
            <Bell size={35} />
            <h3>{t("notificationHistory.emptyTitle")}</h3>
            <p>{t("notificationHistory.emptyDescription")}</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-history-item ${
                notification.isRead ? t("notificationHistory.read") : t("notificationHistory.unread")
              }`}
            >
              <div className="notification-history-icon">
                <Bell size={19} />
              </div>

              <div className="notification-history-content">
                <div className="notification-history-title">
                  <strong>{notification.title}</strong>
                  <span className={notification.isRead ? "read-label" : "unread-label"}>
                    {notification.isRead ? t("notificationHistory.read") : t("notificationHistory.unread")}
                  </span>
                </div>

                <p>{notification.message}</p>

                <small>
                  {new Date(notification.createdAt).toLocaleString(numberLocale)}
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
            {t("notificationHistory.previous")}
          </button>

          <span>
            {t("notificationHistory.page", { page, totalPages })}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((previous) => previous + 1)}
          >
            {t("notificationHistory.next")}
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;
