
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useTranslation } from "react-i18next";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    restaurantName: "",
    restaurantSlug: "",
    logo: "",
    branchName: "Main Branch",
    address: "",
    city: "",
    phone: "",
  });

  const [portalTheme, setPortalTheme] = useState({
    primary: "#171c1a",
    secondary: "#c99a43",
    accent: "#e0b45c",
  });

  const [customerTheme, setCustomerTheme] = useState({
    primary: "#171c1a",
    secondary: "#c99a43",
    accent: "#e0b45c",
  });

  const updateForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateTheme = (setter, theme, key, value) => {
    setter({ ...theme, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError(t("auth.register.passwordLength"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("auth.register.passwordMismatch"));
      return;
    }

    if (form.ownerName.trim().length > 25) {
      setError(t("auth.register.ownerNameLength"));
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        password: form.password,
        restaurantName: form.restaurantName.trim(),
        restaurantSlug: form.restaurantSlug.trim() || undefined,
        logo: form.logo.trim() || null,
        branchName: form.branchName.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
        portalTheme,
        customerTheme,
      };

      const response = await api.post("/auth/signup", payload);

      const { token, user, branch } = response.data;

      if (!token || !user) {
        throw new Error(t("auth.login.invalidResponse"));
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("branchId", String(branch.id));

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        t("auth.register.error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/login" style={styles.brand}>
          <span style={styles.brandIcon}>R</span>
          <span>{t("auth.brand")}</span>
        </Link>

        <div style={styles.headerRight}>
          {t("auth.register.alreadyRegistered")} <Link to="/login" style={styles.loginLink}>{t("auth.login.signIn")}</Link>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.heading}>
          <span style={styles.eyebrow}>{t("auth.register.eyebrow")}</span>
          <h1>{t("auth.register.heading")}</h1>
          <p>{t("auth.register.description")}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>⚠ {error}</div>}

          <section style={styles.section}>
            <div style={styles.sectionHeading}>
              <span style={styles.number}>01</span>
              <div>
                <h2>{t("auth.register.ownerTitle")}</h2>
                <p>{t("auth.register.ownerDescription")}</p>
              </div>
            </div>

            <div style={styles.grid}>
              <Field label={t("auth.register.ownerName")} name="ownerName" value={form.ownerName} onChange={updateForm} placeholder={t("auth.register.ownerNamePlaceholder")} required />
              <Field label={t("auth.email")} name="email" type="email" value={form.email} onChange={updateForm} placeholder="you@example.com" required />
              <Field label={t("auth.password")} name="password" type="password" value={form.password} onChange={updateForm} placeholder={t("auth.register.passwordPlaceholder")} required />
              <Field label={t("auth.register.confirmPassword")} name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateForm} placeholder={t("auth.register.confirmPasswordPlaceholder")} required />
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeading}>
              <span style={styles.number}>02</span>
              <div>
                <h2>{t("auth.register.restaurantTitle")}</h2>
                <p>{t("auth.register.restaurantDescription")}</p>
              </div>
            </div>

            <div style={styles.grid}>
              <Field label={t("auth.register.restaurantName")} name="restaurantName" value={form.restaurantName} onChange={updateForm} placeholder={t("auth.register.restaurantNamePlaceholder")} required />
              <Field label={t("auth.register.slug")} name="restaurantSlug" value={form.restaurantSlug} onChange={updateForm} placeholder={t("auth.register.slugPlaceholder")} />
              <div style={styles.full}>
                <Field label={t("auth.register.logo")} name="logo" value={form.logo} onChange={updateForm} placeholder={t("auth.register.logoPlaceholder")} />
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeading}>
              <span style={styles.number}>03</span>
              <div>
                <h2>{t("auth.register.branchTitle")}</h2>
                <p>{t("auth.register.branchDescription")}</p>
              </div>
            </div>

            <div style={styles.grid}>
              <Field label=	{t("auth.register.branchName")} name="branchName" value={form.branchName} onChange={updateForm} placeholder={t("auth.register.branchNamePlaceholder")} required />
              <Field label={t("auth.phone")} name="phone" value={form.phone} onChange={updateForm} placeholder="+92 300 1234567" />
              <Field label={t("auth.city")} name="city" value={form.city} onChange={updateForm} placeholder={t("auth.register.cityPlaceholder")} />
              <Field label={t("auth.address")} name="address" value={form.address} onChange={updateForm} placeholder={t("auth.register.addressPlaceholder")} />
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeading}>
              <span style={styles.number}>04</span>
              <div>
                <h2>{t("auth.register.portalTheme")}</h2>
                <p>{t("auth.register.portalThemeDescription")}</p>
              </div>
            </div>

            <ThemePicker theme={portalTheme} t={t} onChange={(key, value) => updateTheme(setPortalTheme, portalTheme, key, value)} />
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeading}>
              <span style={styles.number}>05</span>
              <div>
                <h2>{t("auth.register.customerTheme")}</h2>
                <p>{t("auth.register.customerThemeDescription")}</p>
              </div>
            </div>

            <ThemePicker theme={customerTheme} t={t} onChange={(key, value) => updateTheme(setCustomerTheme, customerTheme, key, value)} />
          </section>

          <div style={styles.submitArea}>
            <button type="submit" disabled={loading} style={{
              ...styles.submit,
              opacity: loading ? 0.65 : 1,
            }}>
              {loading ? t("auth.register.loading") : t("auth.register.submit")}
            </button>
            <p>{t("auth.register.footer")}</p>
          </div>
        </form>
      </main>
    </div>
  );
};

const Field = ({ label, name, value, onChange, placeholder, type = "text", required = false }) => (
  <div style={styles.field}>
    <label style={styles.label}>{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      style={styles.input}
    />
  </div>
);

const ThemePicker = ({ theme, onChange, t }) => (
  <div style={styles.themeGrid}>
    {[
      ["primary", t("auth.register.primaryColor")],
      ["secondary", t("auth.register.secondaryColor")],
      ["accent", t("auth.register.accentColor")],
    ].map(([key, label]) => (
      <div key={key} style={styles.colorField}>
        <label style={styles.label}>{label}</label>
        <div style={styles.colorInput}>
          <input
            type="color"
            value={theme[key]}
            onChange={(e) => onChange(key, e.target.value)}
          />
          <span>{theme[key].toUpperCase()}</span>
        </div>
      </div>
    ))}
    <div style={styles.preview}>
      <div style={{
        ...styles.previewBar,
        background: theme.primary,
      }}>
        <span style={{ color: "#fff" }}>{t("auth.register.preview")}</span>
        <span style={{ color: theme.accent }}>●</span>
      </div>
      <div style={styles.previewBody}>
        <span style={{ color: theme.primary, fontWeight: "bold" }}>{t("auth.register.welcomePreview")}</span>
        <button type="button" style={{
          ...styles.previewButton,
          background: theme.secondary,
        }}>{t("auth.register.viewMenu")}</button>
      </div>
    </div>
  </div>
);

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f6f4",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#202722",
  },
  header: {
    minHeight: "75px",
    padding: "15px 6%",
    background: "#171c1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    flexWrap: "wrap",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#fff",
    fontSize: "13px",
    letterSpacing: "1px",
  },
  brandIcon: {
    width: "38px",
    height: "38px",
    display: "grid",
    placeItems: "center",
    borderRadius: "10px",
    background: "#c99a43",
    color: "#171c1a",
    fontSize: "23px",
    fontWeight: "bold",
  },
  headerRight: { color: "#c3c8c4", fontSize: "13px" },
  loginLink: { color: "#e0b45c", fontWeight: "bold", marginLeft: "5px" },
  main: { maxWidth: "900px", width: "92%", margin: "45px auto 70px" },
  heading: { marginBottom: "30px" },
  eyebrow: { color: "#b18539", fontSize: "11px", fontWeight: "bold", letterSpacing: "2px" },
  headingTitle: { fontSize: "30px" },
  section: {
    background: "#fff",
    padding: "28px",
    borderRadius: "13px",
    border: "1px solid #e8eae7",
    marginBottom: "18px",
  },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "25px",
  },
  number: {
    width: "38px",
    height: "38px",
    display: "grid",
    placeItems: "center",
    background: "#f8f0df",
    color: "#a77a2e",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "13px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "20px",
  },
  full: { gridColumn: "1 / -1" },
  field: { display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 },
  label: { fontSize: "12px", fontWeight: "600", color: "#454c47" },
  input: {
    width: "100%",
    height: "46px",
    border: "1px solid #dfe3df",
    borderRadius: "8px",
    padding: "0 13px",
    fontSize: "13px",
    outlineColor: "#c99a43",
    background: "#fff",
  },
  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "18px",
  },
  colorField: { display: "flex", flexDirection: "column", gap: "8px" },
  colorInput: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #e1e4e0",
    padding: "6px 10px",
    borderRadius: "8px",
    color: "#555",
    fontSize: "12px",
  },
  preview: {
    gridColumn: "1 / -1",
    border: "1px solid #e5e5e5",
    borderRadius: "9px",
    overflow: "hidden",
  },
  previewBar: {
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    fontWeight: "bold",
  },
  previewBody: {
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  previewButton: {
    border: "none",
    borderRadius: "6px",
    padding: "9px 15px",
    color: "#fff",
    fontWeight: "bold",
  },
  error: {
    padding: "13px",
    borderRadius: "8px",
    background: "#fff0ee",
    color: "#bd3428",
    fontSize: "13px",
    marginBottom: "18px",
  },
  submitArea: { textAlign: "center", marginTop: "25px" },
  submit: {
    width: "100%",
    maxWidth: "430px",
    minHeight: "53px",
    border: "none",
    borderRadius: "9px",
    background: "#c99a43",
    color: "#171c1a",
    fontWeight: "bold",
    fontSize: "14px",
  },
};

export default Register;
