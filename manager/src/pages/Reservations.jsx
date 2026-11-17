
import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2, X } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const today = new Date().toLocaleDateString("en-CA");

const initialForm = {
  customerName: "",
  phone: "",
  partySize: "2",
  reservationDate: today,
  reservationTime: "19:00",
  notes: "",
};

const statuses = [
  "pending",
  "confirmed",
  "seated",
  "cancelled",
  "no_show",
];

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/reservations", {
        params: {
          ...(date && { date }),
          ...(search.trim() && { search: search.trim() }),
        },
      });

      setReservations(res.data.reservations || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load reservations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [date, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.post("/reservations", {
        ...form,
        partySize: Number(form.partySize),
      });

      setMessage("Reservation created successfully");
      setForm(initialForm);
      await fetchReservations();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create reservation"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setError("");
      await api.put(`/reservations/${id}`, { status });
      setMessage("Reservation status updated");
      await fetchReservations();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update status"
      );
    }
  };

  const deleteReservation = async (id) => {
    if (!window.confirm("Delete this reservation?")) return;

    try {
      await api.delete(`/reservations/${id}`);
      setMessage("Reservation deleted");
      await fetchReservations();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete reservation"
      );
    }
  };

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>Reservations</h1>
          <p>Manage customer table reservations for this branch.</p>
        </div>

        <button type="button" onClick={fetchReservations}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="inventory-alert error">{error}</div>}
      {message && <div className="inventory-alert success">{message}</div>}

      <form className="management-form" onSubmit={handleSubmit}>
        <h3><Plus size={18} /> Add Reservation</h3>

        <input
          placeholder="Customer name"
          value={form.customerName}
          onChange={(e) =>
            setForm({ ...form, customerName: e.target.value })
          }
          maxLength="100"
          required
        />

        <input
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
          maxLength="25"
          required
        />

        <input
          type="number"
          min="1"
          max="100"
          placeholder="Number of guests"
          value={form.partySize}
          onChange={(e) =>
            setForm({ ...form, partySize: e.target.value })
          }
          required
        />

        <label>Reservation Date</label>
        <input
          type="date"
          value={form.reservationDate}
          onChange={(e) =>
            setForm({ ...form, reservationDate: e.target.value })
          }
          required
        />

        <label>Reservation Time</label>
        <input
          type="time"
          value={form.reservationTime}
          onChange={(e) =>
            setForm({ ...form, reservationTime: e.target.value })
          }
          required
        />

        <textarea
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) =>
            setForm({ ...form, notes: e.target.value })
          }
        />

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            <Plus size={17} />
            {saving ? "Saving..." : "Add Reservation"}
          </button>
        </div>
      </form>

      <div className="management-list">
        <h3>Reservation Records ({reservations.length})</h3>

        <input
          placeholder="Search customer name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "14px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />

        <label>Filter by date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            display: "block",
            padding: "10px",
            margin: "8px 0 20px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />

        {loading ? (
          <p>Loading reservations...</p>
        ) : reservations.length === 0 ? (
          <p>No reservations found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Guests</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {reservations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.customerName}</strong>
                      {item.notes && (
                        <small style={{ display: "block" }}>
                          {item.notes}
                        </small>
                      )}
                    </td>
                    <td>{item.phone}</td>
                    <td>{item.partySize}</td>
                    <td>{String(item.reservationDate).slice(0, 10)}</td>
                    <td>{item.reservationTime}</td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateStatus(item.id, e.target.value)
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => deleteReservation(item.id)}
                        title="Delete reservation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
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

export default Reservations;
