
import { useEffect, useState } from "react";
import { Plus, Pencil, Star, MapPin, Phone, Building2 } from "lucide-react";
import api from "../services/api";
import "./Management.css";
import { useTranslation } from "react-i18next";

const Branches = () => {
  const { t } = useTranslation();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    taxEnabled: false,
    taxRate: 0,
    serviceChargeEnabled: false,
    serviceChargeRate: 0,
    discountEnabled: false,
    discountRate: 0,
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get("/branches");
      setBranches(res.data.branches || []);
    } catch (error) {
      alert(error.response?.data?.message || t("branches.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      address: "",
      city: "",
      phone: "",
      taxEnabled: false,
      taxRate: 0,
      serviceChargeEnabled: false,
      serviceChargeRate: 0,
      discountEnabled: false,
      discountRate: 0,
    });

    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (editId) {
        await api.put(`/branches/${editId}`, form);
        alert(t("branches.updateSuccess"));
      } else {
        await api.post("/branches", form);
        alert(t("branches.createSuccess"));
      }

      resetForm();
      await fetchBranches();
    } catch (error) {
      alert(error.response?.data?.message || t("branches.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (branch) => {
    setEditId(branch.id);
    setForm({
      name: branch.name || "",
      address: branch.address || "",
      city: branch.city || "",
      phone: branch.phone || "",

      taxEnabled: Boolean(branch.taxEnabled),
      taxRate: branch.taxRate ?? 0,

      serviceChargeEnabled: Boolean(branch.serviceChargeEnabled),
      serviceChargeRate: branch.serviceChargeRate ?? 0,

      discountEnabled: Boolean(branch.discountEnabled),
      discountRate: branch.discountRate ?? 0,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setDefault = async (id) => {
    if (!window.confirm(t("branches.confirmDefault"))) return;

    try {
      await api.patch(`/branches/${id}/default`);
      await fetchBranches();
      alert(t("branches.defaultSuccess"));
    } catch (error) {
      alert(error.response?.data?.message || t("branches.defaultError"));
    }
  };

  const toggleStatus = async (branch) => {
    const action = branch.isActive ? t("branches.deactivate").toLowerCase() : t("branches.activate").toLowerCase();

    if (!window.confirm(t("branches.confirmStatus", { action }))) {
      return;
    }

    try {
      await api.patch(`/branches/${branch.id}/status`, {
        isActive: !branch.isActive,
      });

      await fetchBranches();
    } catch (error) {
      alert(error.response?.data?.message || t("branches.statusError"));
    }
  };

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>{t("branches.title")}</h1>
          <p>{t("branches.description")}</p>
        </div>
      </div>

      <form className="management-form" onSubmit={handleSubmit}>
        <h3>{t(editId ? "branches.editBranch" : "branches.addNewBranch")}</h3>

        <input
          name="name"
          placeholder={t("branches.namePlaceholder")}
          value={form.name}
          onChange={handleChange}
          maxLength={150}
          required
        />

        <input
          name="address"
          placeholder={t("branches.addressPlaceholder")}
          value={form.address}
          onChange={handleChange}
        />

        <input
          name="city"
          placeholder={t("branches.cityPlaceholder")}
          value={form.city}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder={t("branches.phonePlaceholder")}
          value={form.phone}
          onChange={handleChange}
        />

        <hr />

        <h3>{t("branches.taxSettings")}</h3>

        <label>
          <input
            type="checkbox"
            name="taxEnabled"
            checked={form.taxEnabled}
            onChange={handleChange}
          />
          {t("branches.enableTax")}
        </label>

        <input
          type="number"
          name="taxRate"
          placeholder={t("branches.taxRatePlaceholder")}
          value={form.taxRate}
          onChange={handleChange}
          min="0"
          max="100"
          step="0.01"
        />

        <hr />

        <h3>{t("branches.serviceChargeSettings")}</h3>

        <label>
          <input
            type="checkbox"
            name="serviceChargeEnabled"
            checked={form.serviceChargeEnabled}
            onChange={handleChange}
          />
          {t("branches.enableServiceCharge")}
        </label>

        <input
          type="number"
          name="serviceChargeRate"
          placeholder={t("branches.serviceChargeRatePlaceholder")}
          value={form.serviceChargeRate}
          onChange={handleChange}
          min="0"
          max="100"
          step="0.01"
        />

        <hr />

        <h3>{t("branches.discountSettings")}</h3>

        <label>
          <input
            type="checkbox"
            name="discountEnabled"
            checked={form.discountEnabled}
            onChange={handleChange}
          />
          {t("branches.enableDiscount")}
        </label>

        <input
          type="number"
          name="discountRate"
          placeholder={t("branches.discountRatePlaceholder")}
          value={form.discountRate}
          onChange={handleChange}
          min="0"
          max="100"
          step="0.01"
        />

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            <Plus size={17} />
            {saving ? t("branches.saving") : editId ? t("branches.updateBranch") : t("branches.addBranch")}
          </button>

          {editId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={resetForm}
            >
              {t("branches.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="management-list">
        <h3>{t("branches.allBranches")} ({branches.length})</h3>

        {loading ? (
          <p>{t("branches.loading")}</p>
        ) : (
          <div className="branch-grid">
            {branches.map((branch) => (
              <div className="branch-card" key={branch.id}>
                <div className="branch-card-header">
                  <div className="branch-icon">
                    <Building2 size={22} />
                  </div>

                  <div>
                    <h3>{branch.name}</h3>
                    <span className={branch.isActive ? "branch-active" : "branch-inactive"}>
                      {branch.isActive ? t("branches.active") : t("branches.inactive")}
                    </span>
                  </div>

                  {branch.isDefault && (
                    <span className="default-badge">{t("branches.default")}</span>
                  )}
                </div>

                <div className="branch-details">
                  <p>
                    <MapPin size={16} />
                    {branch.address || t("branches.noAddress")}
                    {branch.city ? `, ${branch.city}` : ""}
                  </p>

                  <p>
                    <Phone size={16} />
                    {branch.phone || t("branches.noPhone")}
                  </p>
                </div>

                <div className="row-actions">
                  <button type="button" onClick={() => handleEdit(branch)}>
                    <Pencil size={16} /> {t("branches.edit")}
                  </button>

                  {!branch.isDefault && branch.isActive && (
                    <button
                      type="button"
                      onClick={() => setDefault(branch.id)}
                    >
                      <Star size={16} /> {t("branches.setDefault")}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleStatus(branch)}
                  >
                    {branch.isActive ? t("branches.deactivate") : t("branches.activate")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && branches.length === 0 && (
          <p>{t("branches.noBranches")}</p>
        )}
      </div>
    </div>
  );
};

export default Branches;
