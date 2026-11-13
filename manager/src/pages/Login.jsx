
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid server response");
      }

      if (!["manager", "admin", "cashier", "waiter", "kitchen"].includes(user.role)) {
        setError("You are not authorized to access this dashboard");
        return;
      }

      // Store login session
      const storage = remember ? localStorage : sessionStorage;

      storage.setItem("token", token);
      storage.setItem("user", JSON.stringify(user));
      storage.setItem("branchId", String(user.branchId));

      // Remove old sessions from the other storage
      const otherStorage = remember ? sessionStorage : localStorage;
      otherStorage.removeItem("token");
      otherStorage.removeItem("user");
      otherStorage.removeItem("branchId");

      navigate("/", { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.logo}>R</div>
          <span>RESTAURANT <b>MANAGEMENT</b></span>
        </div>

        <div style={styles.hero}>
          <span style={styles.tag}>MANAGEMENT PORTAL</span>

          <h1>
            Manage your
            <br />
            restaurant with
            <br />
            <span>confidence.</span>
          </h1>

          <p>
            A smarter way to manage your restaurant,
            orders, products and daily operations.
          </p>

          <div style={styles.features}>
            <div>✓ Complete restaurant control</div>
            <div>✓ Real-time management</div>
            <div>✓ Simple and secure access</div>
          </div>
        </div>

        <div style={styles.footer}>
          © 2026 Restaurant Management System
        </div>
      </div>

      <div style={styles.right}>
        <form onSubmit={handleLogin} style={styles.card}>
          <div style={styles.mobileLogo}>🍽️ Restaurant</div>

          <div style={styles.welcome}>WELCOME BACK</div>

          <h2>Sign in to your account</h2>

          <p style={styles.subtitle}>
            Enter your credentials to access your dashboard.
          </p>

          {error && (
            <div style={styles.error}>
              ⚠ {error}
            </div>
          )}

          <label style={styles.label}>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>

          <div style={styles.passwordBox}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={styles.passwordInput}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.showButton}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <label style={styles.remember}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submit,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          <div style={styles.bottom}>
            Don't have an account? <Link to="/register" style={{ color: "#a67a2c", fontWeight: "bold" }}>Create one</Link>
          </div>

          <div style={styles.bottom}>
            Authorized manager and admin access only.
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  left: {
    width: "48%",
    background: "#171c1a",
    color: "#fff",
    padding: "45px 55px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    letterSpacing: "1px",
  },
  logo: {
    background: "#d9a441",
    color: "#171c1a",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    display: "grid",
    placeItems: "center",
    fontSize: "25px",
    fontWeight: "bold",
  },
  hero: {
    maxWidth: "480px",
    margin: "50px auto",
  },
  tag: {
    color: "#e0b45c",
    letterSpacing: "3px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  footer: {
    color: "#929994",
    fontSize: "12px",
  },
  right: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "410px",
  },
  mobileLogo: {
    display: "none",
  },
  welcome: {
    color: "#bd8d37",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    marginBottom: "12px",
  },
  subtitle: {
    color: "#858585",
    fontSize: "14px",
    lineHeight: "1.7",
    marginBottom: "30px",
  },
  label: {
    display: "block",
    marginBottom: "9px",
    marginTop: "20px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#292d2a",
  },
  input: {
    width: "100%",
    padding: "15px",
    border: "1px solid #deded9",
    borderRadius: "9px",
    outline: "none",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  passwordBox: {
    display: "flex",
    border: "1px solid #deded9",
    borderRadius: "9px",
    overflow: "hidden",
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    padding: "15px",
    border: "none",
    outline: "none",
    fontSize: "14px",
  },
  showButton: {
    border: "none",
    background: "#fff",
    color: "#a67a2c",
    cursor: "pointer",
    padding: "0 15px",
  },
  remember: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "20px 0",
    fontSize: "13px",
    color: "#666",
  },
  submit: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "9px",
    background: "#c99a43",
    color: "#171c1a",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    padding: "12px",
    borderRadius: "8px",
    background: "#fff0ee",
    color: "#bd3428",
    fontSize: "13px",
    marginBottom: "15px",
  },
  bottom: {
    textAlign: "center",
    marginTop: "25px",
    color: "#999",
    fontSize: "12px",
  },
};

export default Login;
