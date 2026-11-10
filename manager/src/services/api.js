
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const storage = localStorage.getItem("token")
    ? localStorage
    : sessionStorage;

  const token = storage.getItem("token");

  // Current selected branch takes priority.
  // branchId remains as fallback for existing login sessions.
  const branchId =
    storage.getItem("currentBranchId") ||
    storage.getItem("branchId");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (branchId) {
    config.headers["x-branch-id"] = String(branchId);
  }

  return config;
});

export default api;
