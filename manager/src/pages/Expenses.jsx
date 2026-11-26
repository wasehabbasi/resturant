import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api from "../services/api";
import "./Management.css";
import { useTranslation } from "react-i18next";

const today = new Date().toISOString().slice(0, 10);

const Expenses = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "ur" ? "ur-PK" : "en-PK";
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
    expenseDate: today,
    paymentMethod: "cash",
  });

  const fetchExpenses = async () => {
    try {
      const res = await api.get("/expenses");
      setExpenses(res.data.expenses || []);
      setTotal(Number(res.data.total || 0));
    } catch (error) {
      alert(error.response?.data?.message || t("expenses.loadError"));
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      category: "",
      description: "",
      amount: "",
      expenseDate: today,
      paymentMethod: "cash",
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (editId) {
        await api.put(`/expenses/${editId}`, form);
        alert(t("expenses.updateSuccess"));
      } else {
        await api.post("/expenses", form);
        alert(t("expenses.addSuccess"));
      }

      resetForm();
      await fetchExpenses();
    } catch (error) {
      alert(error.response?.data?.message || t("expenses.saveError"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setEditId(expense.id);
    setForm({
      category: expense.category || "",
      description: expense.description || "",
      amount: expense.amount,
      expenseDate: String(expense.expenseDate).slice(0, 10),
      paymentMethod: expense.paymentMethod || "cash",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("expenses.confirmDelete"))) {
      return;
    }

    try {
      await api.delete(`/expenses/${id}`);
      await fetchExpenses();
      alert(t("expenses.deleteSuccess"));
    } catch (error) {
      alert(error.response?.data?.message || t("expenses.deleteError"));
    }
  };

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString(numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>{t("expenses.title")}</h1>
          <p>{t("expenses.description")}</p>
        </div>
      </div>

      <div className="management-list">
        <h2>{t("expenses.totalExpenses")}</h2>
        <h1>Rs. {formatAmount(total)}</h1>
      </div>

      <form className="management-form" onSubmit={handleSubmit}>
        <h3>{editId ? t("expenses.updateExpense") : t("expenses.addNewExpense")}</h3>

        <input
          name="category"
          placeholder={t("expenses.categoryPlaceholder")}
          value={form.category}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder={t("expenses.descriptionPlaceholder")}
          value={form.description}
          onChange={handleChange}
        />

        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder={t("expenses.amountPlaceholder")}
          value={form.amount}
          onChange={handleChange}
          required
        />

        <label>{t("expenses.expenseDate")}</label>
        <input
          name="expenseDate"
          type="date"
          value={form.expenseDate}
          onChange={handleChange}
          required
        />

        <select
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
        >
          <option value="cash">{t("expenses.cash")}</option>
          <option value="bank">{t("expenses.bank")}</option>
          <option value="card">{t("expenses.card")}</option>
          <option value="other">{t("expenses.other")}</option>
        </select>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            <Plus size={17} />
            {loading ? t("expenses.saving") : editId ? t("expenses.updateExpense") : t("expenses.addExpense")}
          </button>

          {editId && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              <X size={17} /> {t("expenses.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="management-list">
        <h3>{t("expenses.records")} ({expenses.length})</h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>{t("expenses.date")}</th>
                <th>{t("expenses.category")}</th>
                <th>{t("expenses.description")}</th>
                <th>{t("expenses.payment")}</th>
                <th>{t("expenses.amount")}</th>
                <th>{t("expenses.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{String(expense.expenseDate).slice(0, 10)}</td>
                  <td>{expense.category}</td>
                  <td>{expense.description || "-"}</td>
                  <td>{expense.paymentMethod}</td>
                  <td>Rs. {formatAmount(expense.amount)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleEdit(expense)}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {expenses.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    	{t("expenses.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;