
import { useEffect, useState } from "react";
import { Plus, Pencil, Star, MapPin, Phone, Building2 } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get("/branches");
      setBranches(res.data.branches || []);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ name: "", address: "", city: "", phone: "" });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (editId) {
        await api.put(`/branches/${editId}`, form);
        alert("Branch updated successfully");
      } else {
        await api.post("/branches", form);
        alert("Branch created successfully");
      }

      resetForm();
      await fetchBranches();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save branch");
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
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setDefault = async (id) => {
    if (!window.confirm("Set this branch as the default branch?")) return;

    try {
      await api.patch(`/branches/${id}/default`);
      await fetchBranches();
      alert("Default branch updated");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to set default branch");
    }
  };

  const toggleStatus = async (branch) => {
    const action = branch.isActive ? "deactivate" : "activate";

    if (!window.confirm(`Are you sure you want to ${action} this branch?`)) {
      return;
    }

    try {
      await api.patch(`/branches/${branch.id}/status`, {
        isActive: !branch.isActive,
      });

      await fetchBranches();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update branch");
    }
  };

  return (
    <div className="management-page">
      <div className="management-heading">
        <div>
          <h1>Branch Management</h1>
          <p>Manage your restaurant locations and branches</p>
        </div>
      </div>

      <form className="management-form" onSubmit={handleSubmit}>
        <h3>{editId ? "Edit Branch" : "Add New Branch"}</h3>

        <input
          name="name"
          placeholder="Branch name"
          value={form.name}
          onChange={handleChange}
          maxLength={150}
          required
        />

        <input
          name="address"
          placeholder="Complete address"
          value={form.address}
          onChange={handleChange}
        />

        <input
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Contact number"
          value={form.phone}
          onChange={handleChange}
        />

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            <Plus size={17} />
            {saving ? "Saving..." : editId ? "Update Branch" : "Add Branch"}
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
        <h3>All Branches ({branches.length})</h3>

        {loading ? (
          <p>Loading branches...</p>
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
                      {branch.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {branch.isDefault && (
                    <span className="default-badge">Default</span>
                  )}
                </div>

                <div className="branch-details">
                  <p>
                    <MapPin size={16} />
                    {branch.address || "No address"}
                    {branch.city ? `, ${branch.city}` : ""}
                  </p>

                  <p>
                    <Phone size={16} />
                    {branch.phone || "No phone number"}
                  </p>
                </div>

                <div className="row-actions">
                  <button type="button" onClick={() => handleEdit(branch)}>
                    <Pencil size={16} /> Edit
                  </button>

                  {!branch.isDefault && branch.isActive && (
                    <button
                      type="button"
                      onClick={() => setDefault(branch.id)}
                    >
                      <Star size={16} /> Set Default
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleStatus(branch)}
                  >
                    {branch.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && branches.length === 0 && (
          <p>No branches found.</p>
        )}
      </div>
    </div>
  );
};

export default Branches;
