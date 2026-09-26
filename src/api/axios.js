import axios from "axios";

// `??` (not `||`) matters here: production deploys intentionally set
// VITE_API_BASE_URL to an empty string for same-origin requests, and `||`
// treats "" as falsy, silently overriding it back to the local dev default.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const api = axios.create({
  baseURL: `${baseURL.replace(/\/$/, "")}/api`,
});

// Attach JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("hb_token");
      localStorage.removeItem("hb_username");
      localStorage.removeItem("hb_name");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
