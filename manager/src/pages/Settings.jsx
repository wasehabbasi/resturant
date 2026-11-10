
import { useEffect, useState } from "react";
import { Building2, ImagePlus, Trash2, Save } from "lucide-react";
import api from "../services/api";
import "./Settings.css";

const DEFAULT_THEME = {
    primary: "#171c1a",
    secondary: "#c99a43",
    button: "#e0b45c",
};

const Settings = () => {
    const [restaurant, setRestaurant] = useState(null);
    const [name, setName] = useState("");
    const [portalTheme, setPortalTheme] = useState(DEFAULT_THEME);
    const [customerTheme, setCustomerTheme] = useState(DEFAULT_THEME);
    const [selectedLogo, setSelectedLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;


        const loadSettings = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/restaurant");
                const data = response.data.restaurant;

                const portal = typeof data.portalTheme === "string"
                    ? JSON.parse(data.portalTheme)
                    : data.portalTheme || {};

                const customer = typeof data.customerTheme === "string"
                    ? JSON.parse(data.customerTheme)
                    : data.customerTheme || {};

                setRestaurant(data);
                setName(data.name || "");

                setPortalTheme({
                    primary: portal.primary || DEFAULT_THEME.primary,
                    secondary: portal.secondary || DEFAULT_THEME.secondary,
                    button: portal.accent || portal.button || DEFAULT_THEME.button,
                });

                setCustomerTheme({
                    primary: customer.primary || DEFAULT_THEME.primary,
                    secondary: customer.secondary || DEFAULT_THEME.secondary,
                    button: customer.accent || customer.button || DEFAULT_THEME.button,
                });

            } catch (err) {
                console.error("Load settings error:", err);
                setError(
                    err.response?.data?.message || "Unable to load restaurant settings"
                );
            } finally {
                setLoading(false);
            }
        };


        loadSettings();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedLogo) {
            setLogoPreview("");
            return;
        }

        const url = URL.createObjectURL(selectedLogo);
        setLogoPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [selectedLogo]);

    const updateColor = (setter, key, value) => {
        setter((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const logoUrl = logoPreview ||
        (restaurant?.logo
            ? restaurant.logo.startsWith("http")
                ? restaurant.logo
                : `http://localhost:5000${restaurant.logo}`
            : "");


    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const payload = {
                name: name.trim(),
                portalTheme: {
                    primary: portalTheme.primary,
                    secondary: portalTheme.secondary,
                    accent: portalTheme.button,
                },
                customerTheme: {
                    primary: customerTheme.primary,
                    secondary: customerTheme.secondary,
                    accent: customerTheme.button,
                },
            };

            const response = await api.put("/restaurant", payload);

            const data = response.data.restaurant;

            setRestaurant(data);

            setPortalTheme({
                primary: data.portalTheme?.primary || DEFAULT_THEME.primary,
                secondary: data.portalTheme?.secondary || DEFAULT_THEME.secondary,
                button: data.portalTheme?.accent || DEFAULT_THEME.button,
            });

            setCustomerTheme({
                primary: data.customerTheme?.primary || DEFAULT_THEME.primary,
                secondary: data.customerTheme?.secondary || DEFAULT_THEME.secondary,
                button: data.customerTheme?.accent || DEFAULT_THEME.button,
            });

            setMessage("Settings saved successfully.");
        } catch (err) {
            console.error("Settings save error:", err.response?.data || err);
            setError(
                err.response?.data?.message || "Unable to update restaurant settings"
            );
        } finally {
            setSaving(false);
        }
    };


    const handleLogoUpload = async () => {
        if (!selectedLogo) return;

        try {
            setUploading(true);
            setError("");
            setMessage("");

            const formData = new FormData();
            formData.append("logo", selectedLogo);

            const response = await api.post("/restaurant/logo", formData);

            setRestaurant(response.data.restaurant);
            setSelectedLogo(null);
            setMessage("Logo uploaded successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to upload logo"
            );
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveLogo = async () => {
        if (!window.confirm("Remove restaurant logo?")) return;

        try {
            setRemoving(true);
            setError("");
            setMessage("");

            await api.delete("/restaurant/logo");
            setRestaurant((previous) => ({
                ...previous,
                logo: null,
            }));
            setSelectedLogo(null);
            setMessage("Logo removed successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to remove logo"
            );
        } finally {
            setRemoving(false);
        }
    };

    if (loading) {
        return <div className="settings-page">Loading settings...</div>;
    }

    return (
        <div className="settings-page">
            <div className="settings-heading">
                <h1>Restaurant Settings</h1>
                <p>Manage your restaurant information and branding.</p>
            </div>

            {message && <div className="settings-success">{message}</div>}
            {error && <div className="settings-error">{error}</div>}

            <form onSubmit={handleSave}>
                <section className="settings-card">
                    <h2><Building2 size={19} /> Restaurant Information</h2>

                    <div className="settings-field">
                        <label>Restaurant Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={150}
                            required
                            placeholder="Restaurant name"
                        />
                    </div>

                    <div className="settings-field">
                        <label>Restaurant Slug</label>
                        <input value={restaurant?.slug || ""} disabled />
                    </div>
                </section>

                <section className="settings-card">
                    <h2><ImagePlus size={19} /> Restaurant Logo</h2>

                    <div className="logo-management">
                        <div className="logo-preview">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Restaurant logo" />
                            ) : (
                                <span>No Logo</span>
                            )}
                        </div>

                        <div className="logo-controls">
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) =>
                                    setSelectedLogo(e.target.files?.[0] || null)
                                }
                            />

                            <small>JPG, PNG or WEBP. Maximum 2MB.</small>

                            <div className="settings-actions">
                                <button
                                    type="button"
                                    className="settings-primary-btn"
                                    onClick={handleLogoUpload}
                                    disabled={!selectedLogo || uploading}
                                >
                                    {uploading ? "Uploading..." : "Upload Logo"}
                                </button>

                                {restaurant?.logo && (
                                    <button
                                        type="button"
                                        className="settings-danger-btn"
                                        onClick={handleRemoveLogo}
                                        disabled={removing}
                                    >
                                        <Trash2 size={16} />
                                        {removing ? "Removing..." : "Remove"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="settings-card">
                    <h2>Portal Theme</h2>
                    <p className="settings-description">
                        Colors for your management dashboard.
                    </p>

                    {[
                        ["primary", "Primary Color"],
                        ["secondary", "Secondary Color"],
                        ["button", "Button Color"],
                    ].map(([key, label]) => (
                        <div className="settings-color-row" key={key}>
                            <label>{label}</label>
                            <input
                                type="color"
                                value={portalTheme[key] || DEFAULT_THEME[key]}
                                onChange={(e) =>
                                    updateColor(setPortalTheme, key, e.target.value)
                                }
                            />
                        </div>
                    ))}
                </section>

                <section className="settings-card">
                    <h2>Customer Menu Theme</h2>
                    <p className="settings-description">
                        Colors for your public QR menu.
                    </p>

                    {[
                        ["primary", "Primary Color"],
                        ["secondary", "Secondary Color"],
                        ["button", "Button Color"],
                    ].map(([key, label]) => (
                        <div className="settings-color-row" key={key}>
                            <label>{label}</label>
                            <input
                                type="color"
                                value={customerTheme[key] || DEFAULT_THEME[key]}
                                onChange={(e) =>
                                    updateColor(setCustomerTheme, key, e.target.value)
                                }
                            />
                        </div>
                    ))}
                </section>

                <div className="settings-save-area">
                    <button
                        type="submit"
                        className="settings-primary-btn"
                        disabled={saving}
                    >
                        <Save size={17} />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
