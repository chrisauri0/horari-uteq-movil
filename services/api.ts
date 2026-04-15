import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.API_BASE_URL || "https://horarios-backend-58w8.onrender.com";
const API_LOCAL_URL = "https://horarios-backend-58w8.onrender.com"; // Cambia esto si tu backend local tiene otro puerto

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const api2: AxiosInstance = axios.create({
  baseURL: API_LOCAL_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token from storage:", error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado, limpiar storage y redirigir al login
      try {
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("psicologos");
        // Opcional: redirigir al login si es necesario
        // Esto se puede manejar mejor con un contexto de autenticación
      } catch (storageError) {
        console.error("Error clearing storage:", storageError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
export { api2, API_BASE_URL };
