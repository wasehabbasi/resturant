import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const today = new Date().toISOString().slice(0, 10);

const Expenses = () => {
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
      alert(error.response?.data?.message || "Failed to load expenses");
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
        alert("Expense updated successfully");
      } else {
        await api.post("/expenses", form);
        alert("Expense added successfully");
      }

      resetForm();
      await fetchExpenses();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save expense");
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
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await api.delete(`/expenses/${id}`);
      await fetchExpenses();
      alert("Expense deleted successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete expense");
    }
  };

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>Expenses</h1>
          <p>Manage and track your branch expenses</p>
        </div>
      </div>

      <div className="management-list">
        <h2>Total Expenses</h2>
        <h1>Rs. {formatAmount(total)}</h1>
      </div>

      <form className="management-form" onSubmit={handleSubmit}>
        <h3>{editId ? "Update Expense" : "Add New Expense"}</h3>

        <input
          name="category"
          placeholder="Category (e.g. Rent, Salary, Electricity)"
          value={form.category}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description (optional)"
          value={form.description}
          onChange={handleChange}
        />

        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount in PKR"
          value={form.amount}
          onChange={handleChange}
          required
        />

        <label>Expense Date</label>
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
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            <Plus size={17} />
            {loading ? "Saving..." : editId ? "Update Expense" : "Add Expense"}
          </button>

          {editId && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              <X size={17} /> Cancel
            </button>
          )}
        </div>
      </form>

      <div className="management-list">
        <h3>Expense Records ({expenses.length})</h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Actions</th>
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
                    No expenses recorded yet.
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