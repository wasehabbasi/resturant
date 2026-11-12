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
  const [historyTable, setHistoryTable] = useState(null);
  const [tableHistory, setTableHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

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

  const handleViewHistory = async (table) => {
    try {
      setHistoryLoading(true);
      setHistoryError("");
      setHistoryTable(table);
      setTableHistory(null);

      const res = await api.get(
        `/tables/${table.id}/order-history`
      );

      setTableHistory(res.data);
    } catch (error) {
      setHistoryError(
        error.response?.data?.message ||
        "Failed to load table order history"
      );
    } finally {
      setHistoryLoading(false);
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
                table.availabilityStatus ||
                (table.isActive ? "available" : "inactive")
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
              type="button"
              onClick={() => handleViewHistory(table)}
            >
              View Order History
            </button>

            <button
              type="button"
              disabled={!table.isActive}
              onClick={() => setSelectedTable(table)}
            >
              <QrCode size={16} />
              View QR
            </button>

            <button
              type="button"
              disabled={!table.isActive}
              onClick={() => downloadQR(table)}
            >
              <Download size={16} />
              Download
            </button>

            <button
              type="button"
              disabled={!table.isActive}
              onClick={() => handleRegenerateQR(table)}
            >
              <RefreshCw size={16} />
              Regenerate QR
            </button>

            <button
              type="button"
              onClick={() => handleEdit(table)}
            >
              <Pencil size={16} />
              Edit
            </button>

            {table.isActive && (
              <button
                type="button"
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

    {/* QR Preview Modal */}
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
            type="button"
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

          <button
            type="button"
            onClick={() => downloadQR(selectedTable)}
          >
            <Download size={17} />
            Download QR Code
          </button>
        </div>
      </div>
    )}

    {/* Table Order History Modal */}
    {historyTable && (
      <div
        className="qr-modal-overlay"
        onClick={() => {
          setHistoryTable(null);
          setTableHistory(null);
          setHistoryError("");
        }}
      >
        <div
          className="qr-modal table-history-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="modal-close"
            onClick={() => {
              setHistoryTable(null);
              setTableHistory(null);
              setHistoryError("");
            }}
          >
            ✕
          </button>

          <h2>
            Table {historyTable.tableNumber} - Order History
          </h2>

          {historyLoading && <p>Loading order history...</p>}

          {historyError && (
            <p style={{ color: "red" }}>{historyError}</p>
          )}

          {tableHistory && (
            <>
              <div className="combined-bill">
                <h3>Current Combined Bill</h3>

                <p>
                  Active Orders:{" "}
                  {tableHistory.combinedBill.activeOrdersCount}
                </p>

                <h2>
                  Rs.{" "}
                  {Number(
                    tableHistory.combinedBill.total
                  ).toFixed(2)}
                </h2>
              </div>

              <h3>All Orders</h3>

              {tableHistory.orders.length === 0 ? (
                <p>No order history found for this table.</p>
              ) : (
                tableHistory.orders.map((order) => (
                  <div
                    key={order.id}
                    className="history-order-card"
                  >
                    <div>
                      <strong>
                        Order #{order.orderNumber || order.id}
                      </strong>
                      <span> — {order.status}</span>
                    </div>

                    <small>
                      {new Date(order.createdAt).toLocaleString()}
                    </small>

                    <div>
                      {(order.OrderItems || []).map((item) => (
                        <p key={item.id}>
                          {item.Product?.name || "Product"} ×{" "}
                          {item.quantity} — Rs.{" "}
                          {Number(item.subtotal || 0).toFixed(2)}
                        </p>
                      ))}
                    </div>

                    <strong>
                      Order Total: Rs.{" "}
                      {Number(order.totalAmount || 0).toFixed(2)}
                    </strong>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    )}

  </div>
);

};

export default Tables;
