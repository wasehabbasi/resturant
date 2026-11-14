import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priceDrafts, setPriceDrafts] = useState({});
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
      const [productRes, categoryRes, branchProductRes] =
        await Promise.all([
          api.get("/products"),
          api.get("/categories"),
          api.get("/branch-products"),
        ]);

      const branchProducts = new Map(
        branchProductRes.data.products.map((product) => [
          Number(product.id),
          product,
        ])
      );

      setProducts(
        productRes.data.products.map((product) => {
          const branchProduct = branchProducts.get(
            Number(product.id)
          );

          return {
            ...product,
            branchAvailability:
              branchProduct?.branchAvailability ??
              product.isAvailable,
          };
        })
      );

      setCategories(
        (categoryRes.data.categories || []).filter((c) => c.isActive)
      );

      const drafts = {};
      branchProducts.forEach((product) => {
        drafts[product.id] = product.branchPrice;
      });
      setPriceDrafts(drafts);
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
      await fetchData();
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
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const toggleBranchAvailability = async (product) => {
    try {
      await api.put(`/branch-products/${product.id}`, {
        isAvailable: !product.branchAvailability,
      });

      await fetchData();

      alert("Branch product availability updated");
    } catch (error) {
      alert(error.response?.data?.message || "Availability update failed");
    }
  };

  const saveBranchPrice = async (product) => {
    const price = priceDrafts[product.id];

    if (
      price === "" ||
      price === null ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      alert("Please enter a valid price");
      return;
    }

    try {
      await api.put(`/branch-products/${product.id}`, {
        priceOverride: Number(price),
      });

      alert("Branch price updated successfully");
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Price update failed");
    }
  };

  const resetBranchPrice = async (product) => {
    try {
      await api.put(`/branch-products/${product.id}`, {
        priceOverride: null,
      });

      alert("Branch price reset to base price");
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Price reset failed");
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

      <form className="management-form" onSubmit={handleSubmit}>
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
          placeholder="Base Price in PKR"
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
            {loading
              ? "Saving..."
              : editId
                ? "Update Product"
                : "Add Product"}
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
          {products.map((product) => {
            const category = categories.find(
              (c) => Number(c.id) === Number(product.categoryId)
            );

            return (
              <div className="product-card" key={product.id}>
                {product.image ? (
                  <img
                    src={imageUrl(product.image)}
                    alt={product.name}
                    className="product-image"
                  />
                ) : (
                  <div className="product-placeholder">No Image</div>
                )}

                <div className="product-info">
                  <h4>{product.name}</h4>

                  <p>{category?.name || "No category"}</p>

                <div className="branch-availability">
                  <div className="availability-info">
                    <span>Branch Availability</span>

                    <strong
                      className={
                        product.branchAvailability
                          ? "availability-active"
                          : "availability-inactive"
                      }
                    >
                      {product.branchAvailability ? "Available" : "Unavailable"}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={
                      product.branchAvailability
                        ? "availability-toggle unavailable-btn"
                        : "availability-toggle available-btn"
                    }
                    onClick={() => toggleBranchAvailability(product)}
                  >
                    {product.branchAvailability
                      ? "Mark Unavailable"
                      : "Mark Available"}
                  </button>

                  <small>
                    {product.hasAvailabilityOverride
                      ? "Custom availability for this branch"
                      : "Using restaurant default availability"}
                  </small>
                </div>

                  <strong>
                    Branch Price: Rs.{" "}
                    {Number(product.branchPrice).toLocaleString("en-PK")}
                  </strong>

                  <div style={{ marginTop: "10px" }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceDrafts[product.id] ?? ""}
                      onChange={(e) =>
                        setPriceDrafts((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                      placeholder="Branch price"
                    />

                    <div className="row-actions">
                      <button
                        type="button"
                        onClick={() => saveBranchPrice(product)}
                      >
                        Save Price
                      </button>

                      {product.hasPriceOverride && (
                        <button
                          type="button"
                          onClick={() => resetBranchPrice(product)}
                        >
                          Reset Price
                        </button>
                      )}
                    </div>
                  </div>

                  <small>
                    {product.branchAvailability
                      ? "Available in this branch"
                      : "Unavailable in this branch"}
                  </small>

                  <div className="row-actions">
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAvailability(product)}
                    >
                      {product.branchAvailability ? "Disable" : "Enable"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <p>No food items found. Add your first product.</p>
        )}
      </div>
    </div>
  );
};

export default Products;
