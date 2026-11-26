
import { useEffect, useState } from "react";
import { Building2, ImagePlus, Trash2, Save } from "lucide-react";
import api from "../services/api";
import "./Settings.css";
import { useTranslation } from "react-i18next";

const DEFAULT_THEME = {
    primary: "#171c1a",
    secondary: "#c99a43",
    button: "#e0b45c",
};

const Settings = () => {
    const { t } = useTranslation();
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
                    err.response?.data?.message || t("settings.loadError")
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

            setMessage(t("settings.saveSuccess"));
        } catch (err) {
            console.error("Settings save error:", err.response?.data || err);
            setError(
                err.response?.data?.message || t("settings.saveError")
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
            setMessage(t("settings.logoUploadSuccess"));
        } catch (err) {
            setError(
                err.response?.data?.message || t("settings.logoUploadError")
            );
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveLogo = async () => {
        if (!window.confirm(t("settings.confirmRemoveLogo"))) return;

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
            setMessage(t("settings.logoRemoveSuccess"));
        } catch (err) {
            setError(
                err.response?.data?.message || t("settings.logoRemoveError")
            );
        } finally {
            setRemoving(false);
        }
    };

    if (loading) {
        return <div className="settings-page">{t("settings.loading")}</div>;
    }

    return (
        <div className="settings-page">
            <div className="settings-heading">
                <h1>{t("settings.title")}</h1>
                <p>{t("settings.description")}</p>
            </div>

            {message && <div className="settings-success">{message}</div>}
            {error && <div className="settings-error">{error}</div>}

            <form onSubmit={handleSave}>
                <section className="settings-card">
                    <h2><Building2 size={19} /> {t("settings.restaurantInfo")}</h2>

                    <div className="settings-field">
                        <label>{t("settings.restaurantName")}</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={150}
                            required
                            placeholder={t("settings.restaurantNamePlaceholder")}
                        />
                    </div>

                    <div className="settings-field">
                        <label>{t("settings.restaurantSlug")}</label>
                        <input value={restaurant?.slug || ""} disabled />
                    </div>
                </section>

                <section className="settings-card">
                    <h2><ImagePlus size={19} /> {t("settings.restaurantLogo")}</h2>

                    <div className="logo-management">
                        <div className="logo-preview">
                            {logoUrl ? (
                                <img src={logoUrl} alt={t("settings.restaurantLogo")} />
                            ) : (
                                <span>{t("settings.noLogo")}</span>
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

                            <small>{t("settings.logoNote")}</small>

                            <div className="settings-actions">
                                <button
                                    type="button"
                                    className="settings-primary-btn"
                                    onClick={handleLogoUpload}
                                    disabled={!selectedLogo || uploading}
                                >
                                    {uploading ? t("settings.uploading") : t("settings.uploadLogo")}
                                </button>

                                {restaurant?.logo && (
                                    <button
                                        type="button"
                                        className="settings-danger-btn"
                                        onClick={handleRemoveLogo}
                                        disabled={removing}
                                    >
                                        <Trash2 size={16} />
                                        {removing ? t("settings.removing") : t("settings.remove")}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="settings-card">
                    <h2>{t("settings.portalTheme")}</h2>
                    <p className="settings-description">
                        {t("settings.portalDescription")}
                    </p>

                    {[
                        ["primary", t("settings.primaryColor")],
                        ["secondary", t("settings.secondaryColor")],
                        ["button", t("settings.buttonColor")],
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
                    <h2>{t("settings.customerTheme")}</h2>
                    <p className="settings-description">
                        {t("settings.customerDescription")}
                    </p>

                    {[
                        ["primary", "settings.primaryColor"],
                        ["secondary", "settings.secondaryColor"],
                        ["button", "settings.buttonColor"],
                    ].map(([key, label]) => (
                        <div className="settings-color-row" key={key}>
                            <label>{t(label)}</label>
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
                        {saving ? 	t("settings.saving") : t("settings.saveChanges")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
