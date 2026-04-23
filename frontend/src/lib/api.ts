import axios from "axios";

// -------- AXIOS INSTANCE --------

const api = axios.create({
  baseURL: "http://194.164.151.212:5001", // ✅ FIXED
});

// -------- ADD TOKEN AUTOMATICALLY --------

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // ✅ FIX: ensure headers exists
  if (!config.headers) {
    config.headers = {};
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// -------- AUTH MOCK --------

export const auth = {
  getSession: async () => ({ data: { session: null } }),
  signOut: async () => {},
  signInWithPassword: async () => ({ data: null, error: null }),
  signUp: async () => ({ data: null, error: null }),
  onAuthStateChange: () => ({
    data: {
      subscription: {
        unsubscribe: () => {},
      },
    },
  }),
};

export const safeArray = (data: any) => {
  if (Array.isArray(data)) return data;

  console.warn("⚠️ Expected array but got:", data);
  return [];
};

// -------- STORAGE MOCK --------

export const getFileUrl = (path: string) => {
  return path || "";
};

export const uploadFile = async () => {
  return { filePath: "", fileName: "" };
};

export default api;