
import { useEffect, useState } from "react";
import { Building2, ImagePlus, Trash2, Save, Palette } from "lucide-react";
import api from "../services/api";
import "./Settings.css";

const DEFAULT_PORTAL_THEME = {
  primary: "#171c1a",
  secondary: "#c99a43",
  accent: "#e0b45c",
};

const DEFAULT_CUSTOMER_THEME = {
  primary: "#8b0000",
  secondary: "#d4a017",
  accent: "#fff0e5",
};

const Settings = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [name, setName] = useState("");
  const [portalTheme, setPortalTheme] = useState(DEFAULT_PORTAL_THEME);
  const [customerTheme, setCustomerTheme] = useState(DEFAULT_CUSTOMER_THEME);
  const [selectedLogo, setSelectedLogo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/restaurant");
      const data = response.data.restaurant;

      setRestaurant(data);
      setName(data.name || "");
      setPortalTheme({
        ...DEFAULT_PORTAL_THEME,
        ...(data.portalTheme || {}),
      });
      setCustomerTheme({
        ...DEFAULT_CUSTOMER_THEME,
        ...(data.customerTheme || {}),
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load restaurant settings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateTheme = (setter, theme, key, value) => {
    setter({ ...theme, [key]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await api.put("/restaurant", {
        name,
        portalTheme,
        customerTheme,
      });

      setRestaurant(response.data.restaurant);
      setMessage("Restaurant settings saved successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save restaurant settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!selectedLogo) {
      setError("Please select a logo first.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");
      setError("");

      const formData = new FormData();
      formData.append("logo", selectedLogo);

      const response = await api.post("/restaurant/logo", formData);

      setRestaurant(response.data.restaurant);
      setSelectedLogo(null);
      setMessage("Restaurant logo uploaded successfully.");

      const fileInput = document.getElementById("restaurant-logo");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to upload restaurant logo"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm("Are you sure you want to remove the restaurant logo?")) {
      return;
    }

    try {
      setRemoving(true);
      setMessage("");
      setError("");

      await api.delete("/restaurant/logo");

      setRestaurant((prev) => ({ ...prev, logo: null }));
      setSelectedLogo(null);
      setMessage("Restaurant logo removed successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to remove restaurant logo"
      );
    } finally {
      setRemoving(false);
    }
  };

  const getLogoUrl = () => {
    if (selectedLogo) return URL.createObjectURL(selectedLogo);

    if (!restaurant?.logo) return "";

    if (restaurant.logo.startsWith("http")) {
      return restaurant.logo;
    }

    return `http://localhost:5000${restaurant.logo}`;
  };

  if (loading) {
    return <div className="settings-page">Loading restaurant settings...</div>;
  }

  if (error && !restaurant) {
    return (
      <div className="settings-page">
        <h2>Restaurant Settings</h2>
        <p className="settings-error">{error}</p>
        <button type="button" onClick={loadSettings}>Retry</button>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-heading">
        <div>
          <h1>Restaurant Settings</h1>
          <p>Manage your restaurant information and branding.</p>
        </div>
      </div>

      {message && <div className="settings-success">{message}</div>}
      {error && <div className="settings-error">{error}</div>}

      <form onSubmit={handleSave}>
        <section className="settings-card">
          <div className="settings-card-heading">
            <Building2 size={21} />
            <div>
              <h2>Restaurant Information</h2>
              <p>Basic information displayed across your restaurant portal.</p>
            </div>
          </div>

          <div className="settings-field">
            <label>Restaurant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              required
              placeholder="Enter restaurant name"
            />
          </div>

          <div className="settings-field">
            <label>Restaurant Slug</label>
            <input
              type="text"
              value={restaurant?.slug || ""}
              disabled
            />
            <small>Restaurant slug cannot be changed here.</small>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <ImagePlus size={21} />
            <div>
              <h2>Restaurant Logo</h2>
              <p>Upload the logo that represents your restaurant.</p>
            </div>
          </div>

          <div className="logo-management">
            <div className="logo-preview">
              {getLogoUrl() ? (
                <img src={getLogoUrl()} alt="Restaurant logo preview" />
              ) : (
                <span>No Logo</span>
              )}
            </div>

            <div className="logo-controls">
              <input
                id="restaurant-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setSelectedLogo(e.target.files?.[0] || null)}
              />

              <small>JPG, PNG or WEBP. Maximum size: 2MB.</small>

              <div className="settings-actions">
                <button
                  type="button"
                  className="settings-primary-btn"
                  onClick={handleLogoUpload}
                  disabled={!selectedLogo || uploading}
                >
                  <ImagePlus size={17} />
                  {uploading ? "Uploading..." : "Upload Logo"}
                </button>

                {restaurant?.logo && (
                  <button
                    type="button"
                    className="settings-danger-btn"
                    onClick={handleRemoveLogo}
                    disabled={removing}
                  >
                    <Trash2 size={17} />
                    {removing ? "Removing..." : "Remove"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <Palette size={21} />
            <div>
              <h2>Portal Theme</h2>
              <p>Colors used in the restaurant management dashboard.</p>
            </div>
          </div>

          <div className="theme-fields">
            {Object.entries(portalTheme).map(([key, value]) => (
              <div className="settings-field color-field" key={key}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)} Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) =>
                      updateTheme(setPortalTheme, portalTheme, key, e.target.value)
                    }
                  />
                  <span>{value}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="theme-preview"
            style={{
              background: portalTheme.primary,
              color: "#fff",
            }}
          >
            <strong>{name || "Your Restaurant"}</strong>
            <span>Management Portal Preview</span>
            <button
              type="button"
              style={{
                background: portalTheme.secondary,
                color: "#fff",
              }}
            >
              Sample Button
            </button>
            <small style={{ color: portalTheme.accent }}>
              Accent color preview
            </small>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <Palette size={21} />
            <div>
              <h2>Customer Menu Theme</h2>
              <p>Colors used on your public QR menu.</p>
            </div>
          </div>

          <div className="theme-fields">
            {Object.entries(customerTheme).map(([key, value]) => (
              <div className="settings-field color-field" key={key}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)} Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) =>
                      updateTheme(
                        setCustomerTheme,
                        customerTheme,
                        key,
                        e.target.value
                      )
                    }
                  />
                  <span>{value}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="customer-theme-preview"
            style={{
              background: customerTheme.accent,
              borderColor: customerTheme.secondary,
              color: customerTheme.primary,
            }}
          >
            <strong>{name || "Your Restaurant"}</strong>
            <span>Customer QR Menu Preview</span>
            <button
              type="button"
              style={{
                background: customerTheme.primary,
                color: "#fff",
              }}
            >
              View Menu
            </button>
            <small style={{ color: customerTheme.secondary }}>
              Menu accent preview
            </small>
          </div>
        </section>

        <div className="settings-save-area">
          <button
            type="submit"
            className="settings-primary-btn"
            disabled={saving}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Restaurant Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
