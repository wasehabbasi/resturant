import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, QrCode, Download, RefreshCw } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import api from "../services/api";
import "./Tables.css";
import { useTranslation } from "react-i18next";

const CUSTOMER_URL =
  import.meta.env.VITE_CUSTOMER_URL || "http://localhost:5173";

const Tables = () => {
  const { t } = useTranslation();
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
      alert(error.response?.data?.message || t("tables.loadError"));
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
        alert(t("tables.updateSuccess"));
      } else {
        await api.post("/tables", data);
        alert(t("tables.createSuccess"));
      }

      resetForm();
      fetchTables();

    } catch (error) {
      alert(error.response?.data?.message || t("tables.operationError"));
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
    if (!window.confirm(t("tables.confirmDisable"))) return;

    try {
      await api.delete(`/tables/${id}`);
      fetchTables();
    } catch (error) {
      alert(error.response?.data?.message || t("tables.disableError"));
    }
  };

  const handleRegenerateQR = async (table) => {
    const confirmed = window.confirm(
      t("tables.confirmRegenerateQR", { table: table.tableNumber })
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

      alert(t("tables.regenerateSuccess"));
    } catch (error) {
      alert(
        error.response?.data?.message || t("tables.regenerateSuccess")
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
        t("tables.historyError")
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
        <h1>{t("tables.title")}</h1>
        <p>{t("tables.description")}</p>
      </div>
    </div>

    <form className="management-form" onSubmit={handleSubmit}>
      <h3>{editId ? t("tables.editTable") : t("tables.addNewTable")}</h3>

      <input
        type="text"
        placeholder={t("tables.tableNumberPlaceholder")}
        value={tableNumber}
        onChange={(e) => setTableNumber(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder={t("tables.seatingCapacity")}
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
            ? t("common.saving")
            : editId
            ? t("tables.updateTable")
            : t("tables.addTable")}
        </button>

        {editId && (
          <button
            type="button"
            className="cancel-btn"
            onClick={resetForm}
          >
            {t("common.cancel")}
          </button>
        )}
      </div>
    </form>

    <div className="tables-grid">
      {tables.map((table) => (
        <div className="table-card" key={table.id}>

          <div className="table-card-heading">
            <div>
              <h3>{t("tables.table")} {table.tableNumber}</h3>
              <p>{t("tables.capacity")}: {table.capacity} {t("tables.persons")}</p>
            </div>

            <span
              className={`table-status-badge ${
                table.availabilityStatus ||
                (table.isActive ? "available" : "inactive")
              }`}
            >
              {table.availabilityStatus
                ? t("tables.status." + table.availabilityStatus, { defaultValue: table.availabilityStatus })
                : table.isActive
                ? t("tables.available")
                : t("tables.inactive")}
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
              {t("tables.viewOrderHistory")}
            </button>

            <button
              type="button"
              disabled={!table.isActive}
              onClick={() => setSelectedTable(table)}
            >
              <QrCode size={16} />
              {t("tables.viewQR")}
            </button>

            <button
              type="button"
              disabled={!table.isActive}
              onClick={() => downloadQR(table)}
            >
              <Download size={16} />
              {t("tables.download")}
            </button>

            <button
              type="button"
              disabled={!table.isActive}
              onClick={() => handleRegenerateQR(table)}
            >
              <RefreshCw size={16} />
              {t("tables.regenerateQR")}
            </button>

            <button
              type="button"
              onClick={() => handleEdit(table)}
            >
              <Pencil size={16} />
              {t("common.edit")}
            </button>

            {table.isActive && (
              <button
                type="button"
                className="delete-action"
                onClick={() => handleDelete(table.id)}
              >
                <Trash2 size={16} />
                {t("tables.disable")}
              </button>
            )}

          </div>
        </div>
      ))}
    </div>

    {tables.length === 0 && (
      <div className="empty-tables">
        <QrCode size={40} />
        <h3>{t("tables.noTablesFound")}</h3>
        <p>{t("tables.addFirstTable")}</p>
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

          <h2>{t("tables.table")} {selectedTable.tableNumber}</h2>

          <QRCodeCanvas
            value={getMenuUrl(selectedTable)}
            size={230}
            level="H"
            includeMargin
          />

          <p>{t("tables.scanMenu")}</p>

          <button
            type="button"
            onClick={() => downloadQR(selectedTable)}
          >
            <Download size={17} />
            {t("tables.downloadQRCode")}
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
            {t("tables.table")} {historyTable.tableNumber} - {t("tables.orderHistory")}
          </h2>

          {historyLoading && <p>{t("tables.loadingHistory")}</p>}

          {historyError && (
            <p style={{ color: "red" }}>{historyError}</p>
          )}

          {tableHistory && (
            <>
              <div className="combined-bill">
                <h3>{t("tables.combinedBill")}</h3>

                <p>
                  {t("tables.activeOrders")}:{" "}
                  {tableHistory.combinedBill?.activeOrdersCount || 0}
                </p>

                <strong>
                  {t("tables.outstandingTotal")}: Rs.{" "}
                  {Number(tableHistory.combinedBill?.total || 0).toFixed(2)}
                </strong>
              </div>

              <h3>{t("tables.allOrders")}</h3>

              {tableHistory.orders.length === 0 ? (
                <p>{t("tables.noHistory")}</p>
              ) : (
                tableHistory.orders.map((order) => (
                  <div
                    key={order.id}
                    className="history-order-card"
                  >
                    <div>
                      <strong>
                        {t("tables.order")} #{order.orderNumber || order.id}
                      </strong>
                      <span> — {order.status}</span>
                    </div>

                    <small>
                      {new Date(order.createdAt).toLocaleString()}
                    </small>

                    <div>
                      {(order.OrderItems || []).map((item) => (
                        <p key={item.id}>
                          {item.Product?.name || t("tables.product")} ×{" "}
                          {item.quantity} — Rs.{" "}
                          {Number(item.subtotal || 0).toFixed(2)}
                        </p>
                      ))}
                    </div>

                    <strong>
                      {t("tables.orderTotal")}: Rs.{" "}
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
