
import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2, X } from "lucide-react";
import api from "../services/api";
import "./Management.css";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        err.response?.data?.message || t("reservations.loadError")
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

      setMessage(t("reservations.createSuccess"));
      setForm(initialForm);
      await fetchReservations();
    } catch (err) {
      setError(
        err.response?.data?.message || t("reservations.createError")
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setError("");
      await api.put(`/reservations/${id}`, { status });
      setMessage(t("reservations.statusSuccess"));
      await fetchReservations();
    } catch (err) {
      setError(
        err.response?.data?.message ||	t("reservations.statusError")
      );
    }
  };

  const deleteReservation = async (id) => {
    if (!window.confirm(t("reservations.confirmDelete"))) return;

    try {
      await api.delete(`/reservations/${id}`);
      setMessage(	t("reservations.deleteSuccess"));
      await fetchReservations();
    } catch (err) {
      setError(
        err.response?.data?.message || t("reservations.deleteError")
      );
    }
  };

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>{t("reservations.title")}</h1>
          <p>{t("reservations.description")}</p>
        </div>

        <button type="button" onClick={fetchReservations}>
          <RefreshCw size={16} />	{t("reservations.refresh")}
        </button>
      </div>

      {error && <div className="inventory-alert error">{error}</div>}
      {message && <div className="inventory-alert success">{message}</div>}

      <form className="management-form" onSubmit={handleSubmit}>
        <h3><Plus size={18} /> {t("reservations.addReservation")}</h3>

        <input
          placeholder={t("reservations.customerName")}
          value={form.customerName}
          onChange={(e) =>
            setForm({ ...form, customerName: e.target.value })
          }
          maxLength="100"
          required
        />

        <input
          placeholder={t("reservations.phone")}
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
          placeholder={t("reservations.guests")}
          value={form.partySize}
          onChange={(e) =>
            setForm({ ...form, partySize: e.target.value })
          }
          required
        />

        <label>{t("reservations.date")}</label>
        <input
          type="date"
          value={form.reservationDate}
          onChange={(e) =>
            setForm({ ...form, reservationDate: e.target.value })
          }
          required
        />

        <label>{t("reservations.time")}</label>
        <input
          type="time"
          value={form.reservationTime}
          onChange={(e) =>
            setForm({ ...form, reservationTime: e.target.value })
          }
          required
        />

        <textarea
          placeholder={t("reservations.notes")}
          value={form.notes}
          onChange={(e) =>
            setForm({ ...form, notes: e.target.value })
          }
        />

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            <Plus size={17} />
            {saving ? t("reservations.saving") : t("reservations.addReservation")}
          </button>
        </div>
      </form>

      <div className="management-list">
        <h3>{t("reservations.records")} ({reservations.length})</h3>

        <input
          placeholder={t("reservations.searchPlaceholder")}
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

        <label>{t("reservations.filterDate")}</label>
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
          <p>{t("reservations.loading")}</p>
        ) : reservations.length === 0 ? (
          <p>{t("reservations.empty")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>{t("reservations.customer")}</th>
                  <th>{t("reservations.phoneLabel")}</th>
                  <th>{t("reservations.guestsLabel")}</th>
                  <th>{t("reservations.date")}</th>
                  <th>{t("reservations.time")}</th>
                  <th>{t("reservations.status")}</th>
                  <th>{t("reservations.actions")}</th>
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
                            {t(`reservations.statuses.${status}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => deleteReservation(item.id)}
                        title={t("reservations.delete")}
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
