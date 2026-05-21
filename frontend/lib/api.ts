import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("km_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("km_token");
        localStorage.removeItem("km_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  register: (data: RegisterData) => api.post("/auth/register", data),
  login: (data: LoginData) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data: Partial<UpdateProfileData>) => api.put("/auth/me", data),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (data: ChatMessageData) => api.post("/chat/message", data),
  getSessions: () => api.get("/chat/sessions"),
  getSession: (id: string) => api.get(`/chat/sessions/${id}`),
  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),
  streamMessage: (data: ChatMessageData) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("km_token") : "";
    return fetch(`${API_URL}/api/v1/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...data, stream: true }),
    });
  },
};

// Weather APIs
export const weatherAPI = {
  getWeather: (params: WeatherParams) => api.get("/weather", { params }),
};

// Crop APIs
export const cropAPI = {
  recommend: (data: CropRecommendationData) => api.post("/crops/recommend", data),
  detectDisease: (data: DiseaseDetectionData) => api.post("/crops/detect-disease", data),
};

// Market APIs
export const marketAPI = {
  getPrices: (params?: MarketParams) => api.get("/market/prices", { params }),
  getSchemes: (params?: SchemeParams) => api.get("/market/schemes", { params }),
};

// Types
export interface RegisterData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  village?: string;
  district?: string;
  state?: string;
  farm_size?: number;
  soil_type?: string;
  crop_types?: string[];
  preferred_language?: string;
}

export interface LoginData {
  phone: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  village?: string;
  district?: string;
  state?: string;
  farm_size?: number;
  soil_type?: string;
  crop_types?: string[];
  preferred_language?: string;
}

export interface ChatMessageData {
  message: string;
  session_id?: string;
  language?: string;
  stream?: boolean;
}

export interface WeatherParams {
  lat?: number;
  lon?: number;
  city?: string;
  language?: string;
}

export interface CropRecommendationData {
  soil_type: string;
  region: string;
  state: string;
  water_availability: string;
  season: string;
  farm_size?: number;
  budget?: string;
  language?: string;
}

export interface DiseaseDetectionData {
  image_base64: string;
  crop_type?: string;
  language?: string;
}

export interface MarketParams {
  state?: string;
  district?: string;
  crop?: string;
  language?: string;
}

export interface SchemeParams {
  state?: string;
  category?: string;
  query?: string;
  language?: string;
}
