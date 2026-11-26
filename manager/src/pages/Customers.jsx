import { useEffect, useMemo, useState } from "react";
import { Users, ShoppingBag, Wallet, RefreshCw } from "lucide-react";
import api from "../services/api";
import "./Management.css";
import { useTranslation } from "react-i18next";

const Customers = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "ur" ? "ur-PK" : "en-PK";
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/customers");
      setCustomers(res.data.customers || []);
    } catch (err) {
      setError(
        err.response?.data?.message || t("customers.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return customers;

    return customers.filter((customer) =>
      (customer.customerName || "").toLowerCase().includes(term) ||
      (customer.guestId || "").toLowerCase().includes(term)
    );
  }, [customers, search]);

  const totalOrders = customers.reduce(
    (sum, customer) => sum + Number(customer.totalOrders || 0),
    0
  );

  const totalSpent = customers.reduce(
    (sum, customer) => sum + Number(customer.totalSpent || 0),
    0
  );

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString(numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString(numberLocale) : "-";

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>{t("customers.title")}</h1>
          <p>{t("customers.description")}</p>
        </div>

        <button type="button" onClick={fetchCustomers}>
          <RefreshCw size={16} /> {t("customers.refresh")}
        </button>
      </div>

      {error && (
        <div className="inventory-alert error">{error}</div>
      )}

      <div className="management-stats">
        <div className="management-list">
          <Users size={22} />
          <p>{t("customers.totalCustomers")}</p>
          <h2>{customers.length}</h2>
        </div>

        <div className="management-list">
          <ShoppingBag size={22} />
          <p>{t("customers.totalOrders")}</p>
          <h2>{totalOrders}</h2>
        </div>

        <div className="management-list">
          <Wallet size={22} />
          <p>{t("customers.totalSpending")}</p>
          <h2>Rs. {formatAmount(totalSpent)}</h2>
        </div>
      </div>

      <div className="management-list">
        <h3>{t("customers.records")} ({filteredCustomers.length})</h3>

        <input
          type="search"
          placeholder={t("customers.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "16px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />

        {loading ? (
          <p>{t("customers.loading")}</p>
        ) : filteredCustomers.length === 0 ? (
          <p>{t("customers.empty")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>{t("customers.customer")}</th>
                  <th>{t("customers.guestId")}</th>
                  <th>{t("customers.totalOrders")}</th>
                  <th>{t("customers.totalSpent")}</th>
                  <th>{t("customers.lastOrder")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.guestId || `${customer.customerName}-${index}`}>
                    <td>
                      <strong>{customer.customerName || t("customers.guest")}</strong>
                    </td>
                    <td>{customer.guestId || "-"}</td>
                    <td>{customer.totalOrders}</td>
                    <td>Rs. {formatAmount(customer.totalSpent)}</td>
                    <td>{formatDate(customer.lastOrderDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
