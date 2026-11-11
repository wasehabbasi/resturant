
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    image: null,
  });

  const fetchData = async () => {
    try {
      const [productRes, categoryRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);

      setProducts(productRes.data.products);
      setCategories(
        categoryRes.data.categories.filter((c) => c.isActive)
      );
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!form.image) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(form.image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [form.image]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      image: null,
    });

    setEditId(null);

    setCurrentImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = new FormData();

      data.append("name", form.name);
      data.append("description", form.description);
      data.append("price", form.price);
      data.append("categoryId", form.categoryId);

      if (form.image) {
        data.append("image", form.image);
      }

      if (editId) {
        await api.put(`/products/${editId}`, data);
        alert("Product updated successfully");
      } else {
        await api.post("/products", data);
        alert("Product added successfully");
      }

      resetForm();
      fetchData();

    } catch (error) {
      alert(error.response?.data?.message || "Product save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditId(product.id);

    setCurrentImage(product.image || null);

    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      categoryId: product.categoryId,
      image: null,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const toggleAvailability = async (product) => {
    try {
      await api.put(`/products/${product.id}`, {
        isAvailable: !product.isAvailable,
      });

      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Update failed");
    }
  };

  const imageUrl = (image) =>
    image ? `http://localhost:5000${image}` : "";

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>Food Products</h1>
          <p>Manage your restaurant menu items</p>
        </div>
      </div>

      <form
        className="management-form"
        onSubmit={handleSubmit}
      >
        <h3>{editId ? "Edit Food Item" : "Add New Food Item"}</h3>

        <input
          name="name"
          placeholder="Food name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Food description"
          value={form.description}
          onChange={handleChange}
        />

        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price in PKR"
          value={form.price}
          onChange={handleChange}
          required
        />

        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <label className="upload-label">
          Upload Food Image
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
          />
        </label>

        {(imagePreview || currentImage) && (
          <div className="product-image-preview">
            <p>
              {imagePreview
                ? "New Image Preview"
                : "Current Product Image"}
            </p>

            <img
              src={
                imagePreview ||
                `http://localhost:5000${currentImage}`
              }
              alt="Product preview"
            />

            {imagePreview && (
              <small>New image selected. Save to replace the existing image.</small>
            )}
          </div>
        )}

        {form.image && (
          <p>Selected: {form.image.name}</p>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            <Plus size={17} />
            {loading ? "Saving..." : editId ? "Update Product" : "Add Product"}
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

      <div className="management-list">
        <h3>All Food Items ({products.length})</h3>

        <div className="product-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              {product.image ? (
                <img
                  src={imageUrl(product.image)}
                  alt={product.name}
                  className="product-image"
                />
              ) : (
                <div className="product-placeholder">
                  No Image
                </div>
              )}

              <div className="product-info">
                <h4>{product.name}</h4>

                <p>{product.Category?.name || "No category"}</p>

                <strong>
                  Rs. {Number(product.price).toLocaleString("en-PK")}
                </strong>

                <small>
                  {product.isAvailable ? "Available" : "Unavailable"}
                </small>

                <div className="row-actions">
                  <button onClick={() => handleEdit(product)}>
                    <Pencil size={17} />
                  </button>

                  <button onClick={() => toggleAvailability(product)}>
                    {product.isAvailable ? "Disable" : "Enable"}
                  </button>

                  <button onClick={() => handleDelete(product.id)}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <p>No food items found. Add your first product.</p>
        )}
      </div>
    </div>
  );
};

export default Products;
