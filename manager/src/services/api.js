
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const branchId =
    localStorage.getItem("branchId") ||
    sessionStorage.getItem("branchId");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (branchId) {
    config.headers["x-branch-id"] = branchId;
  }

  return config;
});

export default api;
