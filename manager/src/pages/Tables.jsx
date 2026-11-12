import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, QrCode, Download, RefreshCw } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import api from "../services/api";
import "./Tables.css";

const CUSTOMER_URL =
  import.meta.env.VITE_CUSTOMER_URL || "http://localhost:5173";

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [editId, setEditId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await api.get("/tables");
      setTables(res.data.tables);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load tables");
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const resetForm = () => {
    setTableNumber("");
    setCapacity(4);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = {
        tableNumber,
        capacity: Number(capacity),
      };

      if (editId) {
        await api.put(`/tables/${editId}`, data);
        alert("Table updated successfully");
      } else {
        await api.post("/tables", data);
        alert("Table created successfully");
      }

      resetForm();
      fetchTables();

    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (table) => {
    setEditId(table.id);
    setTableNumber(table.tableNumber);
    setCapacity(table.capacity);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this table?")) return;

    try {
      await api.delete(`/tables/${id}`);
      fetchTables();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to deactivate table");
    }
  };

  const handleRegenerateQR = async (table) => {
    const confirmed = window.confirm(
      `Regenerate QR for Table ${table.tableNumber}?\n\nOld QR code will stop working.`
    );

    if (!confirmed) return;

    try {
      const res = await api.post(
        `/tables/${table.id}/regenerate-qr`
      );

      const updatedTable = res.data.table;

      setTables((prev) =>
        prev.map((item) =>
          item.id === updatedTable.id ? updatedTable : item
        )
      );

      if (selectedTable?.id === updatedTable.id) {
        setSelectedTable(updatedTable);
      }

      alert("QR code regenerated successfully. Download the new QR code.");
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to regenerate QR code"
      );
    }
  };

  const getMenuUrl = (table) =>
    `${CUSTOMER_URL}/menu/${table.qrToken}`;

  const downloadQR = (table) => {
    const canvas = document.getElementById(`qr-${table.id}`);

    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `Table-${table.tableNumber}-QR.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="tables-page">

      <div className="management-heading">
        <div>
          <h1>Tables & QR Management</h1>
          <p>Manage restaurant tables and generate QR codes</p>
        </div>
      </div>

      <form className="management-form" onSubmit={handleSubmit}>
        <h3>{editId ? "Edit Table" : "Add New Table"}</h3>

        <input
          type="text"
          placeholder="Table Number (e.g. T01)"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Seating Capacity"
          min="1"
          max="50"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            <Plus size={17} />
            {loading
              ? "Saving..."
              : editId
              ? "Update Table"
              : "Add Table"}
          </button>

          {editId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="tables-grid">

        {tables.map((table) => (
          <div className="table-card" key={table.id}>

            <div className="table-card-heading">
              <div>
                <h3>Table {table.tableNumber}</h3>
                <p>Capacity: {table.capacity} persons</p>
              </div>

              <span
                className={`table-status-badge ${
                  table.availabilityStatus || (table.isActive ? "available" : "inactive")
                }`}
              >
                {table.availabilityStatus
                  ? table.availabilityStatus.charAt(0).toUpperCase() +
                    table.availabilityStatus.slice(1)
                  : table.isActive
                  ? "Available"
                  : "Inactive"}
              </span>
            </div>

            {table.isActive && (
              <div className="qr-preview">
                <QRCodeCanvas
                  id={`qr-${table.id}`}
                  value={getMenuUrl(table)}
                  size={150}
                  level="H"
                  includeMargin
                />
              </div>
            )}

            <div className="table-actions">

              <button
                disabled={!table.isActive}
                onClick={() => setSelectedTable(table)}
              >
                <QrCode size={16} />
                View QR
              </button>

              <button
                disabled={!table.isActive}
                onClick={() => downloadQR(table)}
              >
                <Download size={16} />
                Download
              </button>

              <button
                disabled={!table.isActive}
                onClick={() => handleRegenerateQR(table)}
              >
                <RefreshCw size={16} />
                Regenerate QR
              </button>

              <button onClick={() => handleEdit(table)}>
                <Pencil size={16} />
                Edit
              </button>

              {table.isActive && (
                <button
                  className="delete-action"
                  onClick={() => handleDelete(table.id)}
                >
                  <Trash2 size={16} />
                  Disable
                </button>
              )}

            </div>
          </div>
        ))}

      </div>

      {tables.length === 0 && (
        <div className="empty-tables">
          <QrCode size={40} />
          <h3>No Tables Found</h3>
          <p>Add your first restaurant table to generate a QR code.</p>
        </div>
      )}

      {selectedTable && (
        <div
          className="qr-modal-overlay"
          onClick={() => setSelectedTable(null)}
        >
          <div
            className="qr-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedTable(null)}
            >
              ✕
            </button>

            <h2>Table {selectedTable.tableNumber}</h2>

            <QRCodeCanvas
              value={getMenuUrl(selectedTable)}
              size={230}
              level="H"
              includeMargin
            />

            <p>Scan to view restaurant menu</p>

            <button onClick={() => downloadQR(selectedTable)}>
              <Download size={17} />
              Download QR Code
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tables;
