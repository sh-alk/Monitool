/**
 * API Service Layer
 */
import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  Technician,
  Toolbox,
  AccessLog,
  DashboardStats,
  LoginRequest,
  TokenResponse,
} from '../types/api.types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || 'your-api-key-change-this-in-production';
const API_V1 = `${API_BASE_URL}/api/v1`;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_V1,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add API key and auth token
api.interceptors.request.use(
  (config) => {
    // Add API key to all requests
    config.headers['X-API-Key'] = API_KEY;

    // Add JWT token if available (for future user-specific auth)
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
  }): Promise<User> => {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },
};

// ==================== USERS API ====================
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
};

// ==================== TECHNICIANS API ====================
export const techniciansApi = {
  getAll: async (): Promise<Technician[]> => {
    const response = await api.get<Technician[]>('/technicians');
    return response.data;
  },

  getById: async (id: string): Promise<Technician> => {
    const response = await api.get<Technician>(`/technicians/${id}`);
    return response.data;
  },

  getByNfc: async (nfcUid: string): Promise<Technician> => {
    const response = await api.get<Technician>(`/technicians/by-nfc/${nfcUid}`);
    return response.data;
  },

  create: async (data: Omit<Technician, 'id' | 'created_at' | 'status'>): Promise<Technician> => {
    const response = await api.post<Technician>('/technicians', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Technician>): Promise<Technician> => {
    const response = await api.put<Technician>(`/technicians/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/technicians/${id}`);
    return response.data;
  },
};

// ==================== TOOLBOXES API ====================
export const toolboxesApi = {
  getAll: async (filters?: { zone?: string; status?: string }): Promise<Toolbox[]> => {
    const response = await api.get<Toolbox[]>('/toolboxes', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Toolbox> => {
    const response = await api.get<Toolbox>(`/toolboxes/${id}`);
    return response.data;
  },

  create: async (data: Omit<Toolbox, 'id' | 'created_at' | 'status'>): Promise<Toolbox> => {
    const response = await api.post<Toolbox>('/toolboxes', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Toolbox>): Promise<Toolbox> => {
    const response = await api.put<Toolbox>(`/toolboxes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/toolboxes/${id}`);
    return response.data;
  },
};

// ==================== ACCESS LOGS API ====================
export const accessLogsApi = {
  getAll: async (filters?: {
    toolbox_id?: string;
    technician_id?: string;
    skip?: number;
    limit?: number;
  }): Promise<AccessLog[]> => {
    const response = await api.get<AccessLog[]>('/access-logs', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<AccessLog> => {
    const response = await api.get<AccessLog>(`/access-logs/${id}`);
    return response.data;
  },

  create: async (data: Omit<AccessLog, 'id' | 'timestamp'>): Promise<AccessLog> => {
    const response = await api.post<AccessLog>('/access-logs', data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/access-logs/${id}`);
    return response.data;
  },
};

// ==================== DASHBOARD API ====================
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};

// ==================== IMAGE UPLOAD API ====================
export const imagesApi = {
  upload: async (file: File, subfolder: string = 'toolboxes'): Promise<{
    filename: string;
    file_path: string;
    file_size: number;
    content_type: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subfolder', subfolder);

    const response = await api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (filePath: string): Promise<{ message: string }> => {
    const response = await api.delete(`/images?file_path=${encodeURIComponent(filePath)}`);
    return response.data;
  },
};

export default api;
