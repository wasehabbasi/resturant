
import { useEffect, useState } from "react";
import { Plus, Package, RefreshCw, History } from "lucide-react";
import api from "../services/api";
import "./Management.css";
import { useTranslation } from "react-i18next";

const Inventory = () => {
  const { t, i18n } = useTranslation();
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
    unitCost: "",
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
      setError(err.response?.data?.message || t("inventory.loadError"));
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

      setMessage(t("inventory.createSuccess"));
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || t("inventory.createError"));
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
        unitCost:
          stockForm.type === "stock_in"
            ? Number(stockForm.unitCost)
            : undefined,
        note: stockForm.note,
      });

      setMessage(t("inventory.stockUpdateSuccess"));
      setStockForm({
        itemId: "",
        type: "stock_in",
        quantity: "",
        unitCost: "",
        note: "",
      });

      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || t("inventory.stockUpdateError"));
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
    return <div className="management-page">{t("inventory.loading")}</div>;
  }

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>{t("inventory.title")}</h1>
          <p>{t("inventory.description")}</p>
        </div>
        <button type="button" onClick={fetchData}>
          <RefreshCw size={16} /> {t("inventory.refresh")}
        </button>
      </div>

      {error && <div className="inventory-alert error">{error}</div>}
      {message && <div className="inventory-alert success">{message}</div>}

      <div className="inventory-stats">
        <div className="inventory-stat">
          <Package />
          <div>
            <span>{t("inventory.totalItems")}</span>
            <h2>{items.length}</h2>
          </div>
        </div>
        <div className="inventory-stat">
          <History />
          <div>
            <span>{t("inventory.lowStockItems")}</span>
            <h2>{lowStockCount}</h2>
          </div>
        </div>
      </div>

      <form className="management-form" onSubmit={createItem}>
        <h3><Plus size={18} /> {t("inventory.addItem")}</h3>

        <input
          placeholder={t("inventory.itemNamePlaceholder")}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          placeholder={t("inventory.unitPlaceholder")}
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          required
        />

        <input
          type="number"
          min="0"
          step="0.001"
          placeholder={t("inventory.thresholdPlaceholder")}
          value={form.lowStockThreshold}
          onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
        />

        <textarea
          placeholder={t("inventory.descriptionPlaceholder")}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? t("inventory.saving") : t("inventory.addItemButton")}
          </button>
        </div>
      </form>

      <form className="management-form" onSubmit={updateStock}>
        <h3>{t("inventory.updateBranchStock")}</h3>

        <select
          value={stockForm.itemId}
          onChange={(e) => setStockForm({ ...stockForm, itemId: e.target.value })}
          required
        >
          <option value="">{t("inventory.selectItem")}</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>

        <select
          value={stockForm.type}
          onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
        >
          <option value="stock_in">{t("inventory.stockIn")}</option>
          <option value="stock_out">{t("inventory.stockOut")}</option>
          <option value="adjustment">{t("inventory.stockAdjustment")}</option>
        </select>

        {stockForm.type === "stock_in" && (
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder={t("inventory.purchaseCostPlaceholder")}
            value={stockForm.unitCost}
            onChange={(e) =>
              setStockForm({
                ...stockForm,
                unitCost: e.target.value,
              })
            }
            required
          />
        )}

        <input
          type="number"
          min="0"
          step="0.001"
          placeholder={t(stockForm.type === "adjustment" ? "inventory.actualStockPlaceholder" : "inventory.quantityPlaceholder")}
          value={stockForm.quantity}
          onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
          required
        />

        <input
          placeholder={t("inventory.notePlaceholder")}
          value={stockForm.note}
          onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })}
        />

        <div className="form-actions">
          <button type="submit" disabled={saving || items.length === 0}>
            {saving ? t("inventory.updating") : t("inventory.updateStock")}
          </button>
        </div>
      </form>

      <div className="management-list">
        <h3>{t("inventory.branchInventory")} ({items.length})</h3>

        {items.length === 0 ? (
          <p>{t("inventory.noItems")}</p>
        ) : (
          items.map((item) => (
            <div className="management-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description || t("inventory.noDescription")} · {t("inventory.unit")}: {item.unit}</p>
                <small>
                  {t("inventory.lowStockThreshold")}: {formatQuantity(item.lowStockThreshold)} {item.unit}
                </small>
              </div>

              <div className="inventory-quantity">
                <strong>{formatQuantity(item.quantity)} {item.unit}</strong>
                <span className={item.isLowStock ? "stock-low" : "stock-ok"}>
                  {item.isLowStock ? t("inventory.lowStock") : t("inventory.inStock")}
                </span>
                <small>
                  {t("inventory.averageCost")}: Rs. {Number(item.averageCost || 0).toLocaleString("en-PK")} / {item.unit}
                </small>
              </div>
            </div>


          ))
        )}
      </div>

      <div className="management-list">
        <h3>{t("inventory.recentMovements")}</h3>

        {movements.length === 0 ? (
          <p>{t("inventory.noMovements")}</p>
        ) : (
          movements.map((movement) => (
            <div className="management-row" key={movement.id}>
              <div>
                <strong>{movement.InventoryItem?.name || t("inventory.inventoryItem")}</strong>
                <p>
                  {t("inventory.movementTypes." + movement.type, {
                    defaultValue: movement.type.replace("_", " "),
                  })} ·{" "}
                  {new Date(movement.createdAt).toLocaleString(
                    i18n.language === "ur" ? "ur-PK" : "en-PK"
                  )}
                </p>
                <small>{movement.note || t("inventory.noNote")}</small>
              </div>
              <div className="inventory-quantity">
                <strong>{formatQuantity(movement.newQuantity)} {movement.InventoryItem?.unit}</strong>
                <span>{t("inventory.previous")}: {formatQuantity(movement.previousQuantity)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Inventory;
