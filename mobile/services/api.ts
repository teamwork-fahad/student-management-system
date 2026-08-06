import axios from 'axios';
import { safeStorage } from '@/utils/storage';

// 🌐 LIVE DEPLOYED VERCEL BACKEND API URL
export const API_BASE_URL = 'https://student-management-system-backend-pied.vercel.app/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let memoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  memoryToken = token;
};

// Safe token retriever using safeStorage wrapper
const getStoredToken = async (): Promise<string | null> => {
  if (memoryToken) return memoryToken;
  try {
    const token = await safeStorage.getItem('userToken');
    return token;
  } catch (error) {
    return memoryToken;
  }
};

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getStoredToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Interceptor token error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
