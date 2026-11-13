
import { useEffect, useState } from "react";
import { Plus, Package, RefreshCw, History } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    unit: "pcs",
    description: "",
    lowStockThreshold: "0",
  });

  const [stockForm, setStockForm] = useState({
    itemId: "",
    type: "stock_in",
    quantity: "",
    note: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, movementRes] = await Promise.all([
        api.get("/inventory"),
        api.get("/inventory/movements"),
      ]);

      setItems(inventoryRes.data.items || []);
      setMovements(movementRes.data.movements || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createItem = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.post("/inventory", form);

      setForm({
        name: "",
        unit: "pcs",
        description: "",
        lowStockThreshold: "0",
      });

      setMessage("Inventory item created successfully");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create item");
    } finally {
      setSaving(false);
    }
  };

  const updateStock = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.patch(`/inventory/${stockForm.itemId}/stock`, {
        type: stockForm.type,
        quantity: Number(stockForm.quantity),
        note: stockForm.note,
      });

      setMessage("Stock updated successfully");
      setStockForm({
        itemId: "",
        type: "stock_in",
        quantity: "",
        note: "",
      });

      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Stock update failed");
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = items.filter((item) => item.isLowStock).length;

  const formatQuantity = (value) =>
    Number(value || 0).toLocaleString("en-PK", {
      maximumFractionDigits: 3,
    });

  if (loading) {
    return <div className="management-page">Loading inventory...</div>;
  }

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>Inventory Management</h1>
          <p>Manage stock and inventory for the selected branch.</p>
        </div>
        <button type="button" onClick={fetchData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="inventory-alert error">{error}</div>}
      {message && <div className="inventory-alert success">{message}</div>}

      <div className="inventory-stats">
        <div className="inventory-stat">
          <Package />
          <div>
            <span>Total Items</span>
            <h2>{items.length}</h2>
          </div>
        </div>
        <div className="inventory-stat">
          <History />
          <div>
            <span>Low Stock Items</span>
            <h2>{lowStockCount}</h2>
          </div>
        </div>
      </div>

      <form className="management-form" onSubmit={createItem}>
        <h3><Plus size={18} /> Add Inventory Item</h3>

        <input
          placeholder="Item name (e.g. Chicken)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          placeholder="Unit (kg, litre, pcs)"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          required
        />

        <input
          type="number"
          min="0"
          step="0.001"
          placeholder="Low stock threshold"
          value={form.lowStockThreshold}
          onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
        />

        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add Item"}
          </button>
        </div>
      </form>

      <form className="management-form" onSubmit={updateStock}>
        <h3>Update Branch Stock</h3>

        <select
          value={stockForm.itemId}
          onChange={(e) => setStockForm({ ...stockForm, itemId: e.target.value })}
          required
        >
          <option value="">Select inventory item</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>

        <select
          value={stockForm.type}
          onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
        >
          <option value="stock_in">Stock In</option>
          <option value="stock_out">Stock Out</option>
          <option value="adjustment">Stock Adjustment (actual quantity)</option>
        </select>

        <input
          type="number"
          min="0"
          step="0.001"
          placeholder={stockForm.type === "adjustment" ? "Actual counted stock" : "Quantity"}
          value={stockForm.quantity}
          onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
          required
        />

        <input
          placeholder="Note (optional)"
          value={stockForm.note}
          onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })}
        />

        <div className="form-actions">
          <button type="submit" disabled={saving || items.length === 0}>
            {saving ? "Updating..." : "Update Stock"}
          </button>
        </div>
      </form>

      <div className="management-list">
        <h3>Branch Inventory ({items.length})</h3>

        {items.length === 0 ? (
          <p>No inventory items added yet.</p>
        ) : (
          items.map((item) => (
            <div className="management-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description || "No description"} · Unit: {item.unit}</p>
                <small>
                  Low stock threshold: {formatQuantity(item.lowStockThreshold)} {item.unit}
                </small>
              </div>

              <div className="inventory-quantity">
                <strong>{formatQuantity(item.quantity)} {item.unit}</strong>
                <span className={item.isLowStock ? "stock-low" : "stock-ok"}>
                  {item.isLowStock ? "Low Stock" : "In Stock"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="management-list">
        <h3>Recent Stock Movements</h3>

        {movements.length === 0 ? (
          <p>No stock movements recorded yet.</p>
        ) : (
          movements.map((movement) => (
            <div className="management-row" key={movement.id}>
              <div>
                <strong>{movement.InventoryItem?.name || "Inventory Item"}</strong>
                <p>
                  {movement.type.replace("_", " ").toUpperCase()} ·{" "}
                  {new Date(movement.createdAt).toLocaleString("en-PK")}
                </p>
                <small>{movement.note || "No note"}</small>
              </div>
              <div className="inventory-quantity">
                <strong>{formatQuantity(movement.newQuantity)} {movement.InventoryItem?.unit}</strong>
                <span>Previous: {formatQuantity(movement.previousQuantity)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Inventory;
