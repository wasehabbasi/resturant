import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../services/api";
import "./Management.css";
import { useTranslation } from "react-i18next";

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [recipeProduct, setRecipeProduct] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeSaving, setRecipeSaving] = useState(false);

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
      alert(error.response?.data?.message || t("products.loadError"));
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
        alert(t("products.updateSuccess"));
      } else {
        await api.post("/products", data);
        alert(t("products.addSuccess"));
      }

      resetForm();
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || t("products.saveError"));
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
    if (!window.confirm(t("products.confirmDelete"))) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || t("products.deleteError"));
    }
  };

  const toggleBranchAvailability = async (product) => {
    try {
      await api.put(`/branch-products/${product.id}`, {
        isAvailable: !product.branchAvailability,
      });

      await fetchData();

      alert(t("products.availabilitySuccess"));
    } catch (error) {
      alert(error.response?.data?.message || t("products.availabilityError"));
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
      alert(t("products.validPrice"));
      return;
    }

    try {
      await api.put(`/branch-products/${product.id}`, {
        priceOverride: Number(price),
      });

      alert(t("products.priceSuccess"));
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || t("products.priceError"));
    }
  };

  const resetBranchPrice = async (product) => {
    try {
      await api.put(`/branch-products/${product.id}`, {
        priceOverride: null,
      });

      alert(t("products.priceResetSuccess"));
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || t("products.priceResetError"));
    }
  };

  const openRecipe = async (product) => {
    try {
      setRecipeLoading(true);
      setRecipeProduct(product);

      const [inventoryRes, recipeRes] = await Promise.all([
        api.get("/inventory"),
        api.get(`/product-ingredients/${product.id}`),
      ]);

      setInventoryItems(inventoryRes.data.items || []);

      setRecipeIngredients(
        (recipeRes.data.ingredients || []).map((item) => ({
          inventoryItemId: String(item.inventoryItemId),
          quantityPerProduct: String(item.quantityPerProduct),
        }))
      );
    } catch (error) {
      alert(error.response?.data?.message || t("products.recipeLoadError"));
      setRecipeProduct(null);
    } finally {
      setRecipeLoading(false);
    }
  };

  const addRecipeIngredient = () => {
    setRecipeIngredients((prev) => [
      ...prev,
      { inventoryItemId: "", quantityPerProduct: "" },
    ]);
  };

  const updateRecipeIngredient = (index, field, value) => {
    setRecipeIngredients((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeRecipeIngredient = (index) => {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const saveRecipe = async () => {
    const validIngredients = recipeIngredients.every(
      (item) =>
        item.inventoryItemId &&
        Number(item.quantityPerProduct) > 0 &&
        Number.isFinite(Number(item.quantityPerProduct))
    );

    if (!validIngredients) {
      alert(t("products.validIngredients"));
      return;
    }

    const ids = recipeIngredients.map((item) => item.inventoryItemId);

    if (new Set(ids).size !== ids.length) {
      alert(t("products.duplicateIngredient"));
      return;
    }

    try {
      setRecipeSaving(true);

      await api.put(`/product-ingredients/${recipeProduct.id}`, {
        ingredients: recipeIngredients.map((item) => ({
          inventoryItemId: Number(item.inventoryItemId),
          quantityPerProduct: Number(item.quantityPerProduct),
        })),
      });

      alert(t("products.recipeSaveSuccess"));
      setRecipeProduct(null);
    } catch (error) {
      alert(error.response?.data?.message || t("products.recipeSaveError"));
    } finally {
      setRecipeSaving(false);
    }
  };

  const imageUrl = (image) =>
    image ? `http://localhost:5000${image}` : "";

  return (
    <div className="management-page">

      {recipeProduct && (
        <div className="recipe-modal-overlay">
          <div className="recipe-modal">
            <div className="recipe-modal-header">
              <div>
                <h2>{t("products.recipe")}</h2>
                <p>{recipeProduct.name}</p>
              </div>

              <button
                type="button"
                onClick={() => setRecipeProduct(null)}
              >
                ×
              </button>
            </div>

            {recipeLoading ? (
              <p>{t("products.loadingRecipe")}</p>
            ) : (
              <>
                <div className="recipe-ingredients">
                  {recipeIngredients.map((ingredient, index) => (
                    <div className="recipe-ingredient-row" key={index}>
                      <select
                        value={ingredient.inventoryItemId}
                        onChange={(e) =>
                          updateRecipeIngredient(
                            index,
                            "inventoryItemId",
                            e.target.value
                          )
                        }
                      >
                        <option value="">{t("products.selectIngredient")}</option>

                        {inventoryItems.map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name} ({item.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        placeholder={t("products.quantityPerProduct")}
                        value={ingredient.quantityPerProduct}
                        onChange={(e) =>
                          updateRecipeIngredient(
                            index,
                            "quantityPerProduct",
                            e.target.value
                          )
                        }
                      />

                      <span>
                        {inventoryItems.find(
                          (item) =>
                            String(item.id) === ingredient.inventoryItemId
                        )?.unit || ""}
                      </span>

                      <button
                        type="button"
                        className="recipe-remove-btn"
                        onClick={() => removeRecipeIngredient(index)}
                      >
                        {t("products.remove")}
                      </button>
                    </div>
                  ))}

                  {recipeIngredients.length === 0 && (
                    <p>{t("products.noIngredients")}</p>
                  )}
                </div>

                <button
                  type="button"
                  className="recipe-add-btn"
                  onClick={addRecipeIngredient}
                >
                  + {t("products.addIngredient")}
                </button>

                <div className="recipe-modal-actions">
                  <button
                    type="button"
                    className="recipe-cancel-btn"
                    onClick={() => setRecipeProduct(null)}
                  >
                    {t("products.cancel")}
                  </button>

                  <button
                    type="button"
                    onClick={saveRecipe}
                    disabled={recipeSaving}
                  >
                    {recipeSaving ? t("products.saving") : t("products.saveRecipe")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="management-heading">
        <div>
          <h1>{t("products.title")}</h1>
          <p>{t("products.description")}</p>
        </div>
      </div>

      <form className="management-form" onSubmit={handleSubmit}>
        <h3>{editId ? t("products.editFoodItem") : t("products.addFoodItem")}</h3>

        <input
          name="name"
          placeholder={t("products.foodName")}
          value={form.name}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder={t("products.foodDescription")}
          value={form.description}
          onChange={handleChange}
        />

        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder={t("products.basePrice")}
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
          <option value="">{t("products.selectCategory")}</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <label className="upload-label">
          {t("products.uploadImage")}
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
                ? t("products.newImagePreview")
                : t("products.currentImage")}
            </p>

            <img
              src={
                imagePreview ||
                `http://localhost:5000${currentImage}`
              }
              alt="Product preview"
            />

            {imagePreview && (
              <small>{t("products.replaceImageNote")}</small>
            )}
          </div>
        )}

        {form.image && (
          <p>{t("products.selected")}: {form.image.name}</p>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            <Plus size={17} />
            {loading
              ? "Saving..."
              : editId
                ? t("products.updateProduct")
                : t("products.addProduct")}
          </button>

          {editId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={resetForm}
            >
              {t("products.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="management-list">
        <h3>{t(products.allFoodItems)} ({products.length})</h3>

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
                  <div className="product-placeholder">{t("products.noImage")}</div>
                )}

                <div className="product-info">
                  <h4>{product.name}</h4>

                  <p>{category?.name || "No category"}</p>

                  <div className="branch-availability">
                    <div className="availability-info">
                      <span>{t("products.branchAvailability")}</span>

                      <strong
                        className={
                          product.branchAvailability
                            ? "availability-active"
                            : "availability-inactive"
                        }
                      >
                        {product.branchAvailability ? t("products.available") : t("products.unavailable")}
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
                        ? t("products.markUnavailable")
                        : t("products.markAvailable")}
                    </button>

                    <small>
                      {product.hasAvailabilityOverride
                        ? t("products.customAvailability")
                        : t("products.defaultAvailability")}
                    </small>
                  </div>

                  <strong>
                    {t("products.branchPrice")}: Rs.{" "}
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
                      placeholder={t("products.branchPrice")}
                    />

                    <div className="row-actions">
                      <button
                        type="button"
                        onClick={() => saveBranchPrice(product)}
                      >
                        {t("products.savePrice")}
                      </button>

                      {product.hasPriceOverride && (
                        <button
                          type="button"
                          onClick={() => resetBranchPrice(product)}
                        >
                          {t("products.resetPrice")}
                        </button>
                      )}
                    </div>
                  </div>

                  <small>
                    {product.branchAvailability
                      ? t("products.availableInBranch")
                      : t("products.unavailableInBranch")}
                  </small>

                  <div className="row-actions">

                    <button
                      type="button"
                      onClick={() => openRecipe(product)}
                    >
                      {t("products.manageRecipe")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil size={17} />
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
