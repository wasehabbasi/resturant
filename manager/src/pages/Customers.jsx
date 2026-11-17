
import { useEffect, useMemo, useState } from "react";
import { Users, ShoppingBag, Wallet, RefreshCw } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const Customers = () => {
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
        err.response?.data?.message || "Failed to load customers"
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
    Number(amount || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-PK") : "-";

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>Customers</h1>
          <p>View customer history and spending for this branch.</p>
        </div>

        <button type="button" onClick={fetchCustomers}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="inventory-alert error">{error}</div>
      )}

      <div className="management-stats">
        <div className="management-list">
          <Users size={22} />
          <p>Total Customers</p>
          <h2>{customers.length}</h2>
        </div>

        <div className="management-list">
          <ShoppingBag size={22} />
          <p>Total Orders</p>
          <h2>{totalOrders}</h2>
        </div>

        <div className="management-list">
          <Wallet size={22} />
          <p>Total Customer Spending</p>
          <h2>Rs. {formatAmount(totalSpent)}</h2>
        </div>
      </div>

      <div className="management-list">
        <h3>Customer Records ({filteredCustomers.length})</h3>

        <input
          type="search"
          placeholder="Search customer name or guest ID..."
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
          <p>Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <p>No customers found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Guest ID</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.guestId || `${customer.customerName}-${index}`}>
                    <td>
                      <strong>{customer.customerName || "Guest"}</strong>
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
