import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const registerUser = (data) => apiClient.post("/api/auth/register", data);

export const loginUser = (email, password) => {
  const form = new URLSearchParams();
  form.append("username", email); // OAuth2 spec field name carries the email
  form.append("password", password);
  return apiClient.post("/api/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const fetchMe = () => apiClient.get("/api/auth/me");

// ---- Users ----
export const updateProfile = (data) => apiClient.put("/api/users/profile", data);
export const updateSettings = (data) => apiClient.put("/api/users/settings", data);
export const changePassword = (data) => apiClient.put("/api/users/password", data);

// ---- Research ----
export const createResearch = (topic) => apiClient.post("/api/research", { topic });

export const listResearch = (params) => apiClient.get("/api/research", { params });

export const getResearch = (id) => apiClient.get(`/api/research/${id}`);

export const getResearchStatus = (id) => apiClient.get(`/api/research/${id}/status`);

export const deleteResearch = (id) => apiClient.delete(`/api/research/${id}`);

export const submitFeedback = (id, data) => apiClient.post(`/api/research/${id}/feedback`, data);

// Downloads require the Authorization header, so we fetch as a blob
// and trigger a save via a temporary object URL rather than a plain <a href>.
export const downloadResearchExport = async (id, fmt, filename) => {
  const response = await apiClient.get(`/api/research/${id}/export`, {
    params: { fmt },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `report.${fmt === "pdf" ? "pdf" : "md"}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
