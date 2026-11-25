
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../services/api";
import "./Management.css";
import { useTranslation } from "react-i18next";

const Categories = () => {
  const { t } = useTranslation();
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
      alert(error.response?.data?.message || t("categories.loadError"));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return alert(t("categories.nameRequired"));
    }

    try {
      setLoading(true);

      const data = { name, description };

      if (editId) {
        await api.put(`/categories/${editId}`, data);
        alert(t("categories.updateSuccess"));
      } else {
        await api.post("/categories", data);
        alert(t("categories.addSuccess"));
      }

      resetForm();
      fetchCategories();

    } catch (error) {
      alert(error.response?.data?.message || t("categories.saveError"));
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
    if (!window.confirm(t("categories.confirmDelete"))) return;

    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || t("categories.deleteError"));
    }
  };

  const toggleStatus = async (category) => {
    try {
      await api.put(`/categories/${category.id}`, {
        isActive: !category.isActive,
      });

      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || t("categories.updateError"));
    }
  };

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>{t("categories.title")}</h1>
          <p>{t("categories.description")}</p>
        </div>
      </div>

      <form className="management-form" onSubmit={handleSubmit}>
        <h3>{editId ? t("categories.editCategory") : t("categories.addCategory")}</h3>

        <input
          placeholder={t("categories.categoryName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <textarea
          placeholder={t("categories.categoryDescription")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            <Plus size={17} />
            {loading ? t("categories.saving") : editId ? t("categories.updateCategory") : t("categories.addCategoryButton")}
          </button>

          {editId && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              {t("categories.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="management-list">
        <h3>{t("categories.allCategories")} ({categories.length})</h3>

        {categories.map((category) => (
          <div className="management-row" key={category.id}>
            <div>
              <strong>{category.name}</strong>
              <p>{category.description || t("categories.noDescription")}</p>
              <small>{category.isActive ? t("categories.active") : t("categories.inactive")}</small>
            </div>

            <div className="row-actions">
              <button onClick={() => handleEdit(category)}>
                <Pencil size={17} />
              </button>

              <button onClick={() => toggleStatus(category)}>
                {category.isActive ? t("categories.disable") : t("categories.enable")}
              </button>

              <button onClick={() => handleDelete(category.id)}>
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <p>{t("categories.noCategories")}</p>
        )}
      </div>
    </div>
  );
};

export default Categories;
