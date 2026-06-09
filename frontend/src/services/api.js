import axios from "axios";

// Usamos la variable de entorno de Vite. Si no existe, usamos localhost.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  // Faltaban las comillas invertidas (backticks) en tu código original para que funcione la interpolación
  if (token) config.headers.Authorization = `Bearer ${token}`; 
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("session-expired"));
    }
    return Promise.reject(error);
  }
);

export default api;