
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.categories);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return alert("Category name is required");
    }

    try {
      setLoading(true);

      const data = { name, description };

      if (editId) {
        await api.put(`/categories/${editId}`, data);
        alert("Category updated successfully");
      } else {
        await api.post("/categories", data);
        alert("Category added successfully");
      }

      resetForm();
      fetchCategories();

    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditId(null);
  };

  const handleEdit = (category) => {
    setName(category.name);
    setDescription(category.description || "");
    setEditId(category.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const toggleStatus = async (category) => {
    try {
      await api.put(`/categories/${category.id}`, {
        isActive: !category.isActive,
      });

      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>Categories</h1>
          <p>Manage your restaurant food categories</p>
        </div>
      </div>

      <form className="management-form" onSubmit={handleSubmit}>
        <h3>{editId ? "Edit Category" : "Add New Category"}</h3>

        <input
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <textarea
          placeholder="Category description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            <Plus size={17} />
            {loading ? "Saving..." : editId ? "Update Category" : "Add Category"}
          </button>

          {editId && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="management-list">
        <h3>All Categories ({categories.length})</h3>

        {categories.map((category) => (
          <div className="management-row" key={category.id}>
            <div>
              <strong>{category.name}</strong>
              <p>{category.description || "No description"}</p>
              <small>{category.isActive ? "Active" : "Inactive"}</small>
            </div>

            <div className="row-actions">
              <button onClick={() => handleEdit(category)}>
                <Pencil size={17} />
              </button>

              <button onClick={() => toggleStatus(category)}>
                {category.isActive ? "Disable" : "Enable"}
              </button>

              <button onClick={() => handleDelete(category.id)}>
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <p>No categories found. Add your first category.</p>
        )}
      </div>
    </div>
  );
};

export default Categories;
