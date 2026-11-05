import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://tumakur-armoury-portal-backend.onrender.com/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
          
        case 403:
          toast.error('Access denied. Insufficient permissions.');
          break;
          
        case 404:
          toast.error('Resource not found.');
          break;
          
        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => toast.error(err.msg || err.message || err));
          } else {
            toast.error(data.message || 'Validation failed.');
          }
          break;
          
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data.message || 'An unexpected error occurred.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other error
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
  createAdmin: () => api.post('/auth/create-admin'),
};

export const officersAPI = {
  getAll: (params = {}) => api.get('/officers', { params }),
  getById: (id) => api.get(`/officers/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/officers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/officers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/officers/${id}`),
  searchByKGID: (kgid) => api.get(`/officers/search/kgid/${kgid}`),
  getStats: () => api.get('/officers/stats/overview'),
};

export const armouryAPI = {
  getAll: (params = {}) => api.get('/armoury', { params }),
  getById: (id) => api.get(`/armoury/${id}`),
  create: (data) => api.post('/armoury', data),
  update: (id, data) => api.put(`/armoury/${id}`, data),
  delete: (id) => api.delete(`/armoury/${id}`),
  searchByBarcode: (barcode) => api.get(`/armoury/search/barcode/${barcode}`),
  getStats: () => api.get('/armoury/stats/overview'),
};

export const ammunitionAPI = {
  getAll: (params = {}) => api.get('/ammunition', { params }),
  getById: (id) => api.get(`/ammunition/${id}`),
  create: (data) => api.post('/ammunition', data),
  update: (id, data) => api.put(`/ammunition/${id}`, data),
  delete: (id) => api.delete(`/ammunition/${id}`),
  getLowStock: () => api.get('/ammunition/alerts/low-stock'),
  getExpiring: () => api.get('/ammunition/alerts/expiring'),
  getStats: () => api.get('/ammunition/stats/overview'),
};

export const munitionAPI = {
  getAll: (params = {}) => api.get('/munition', { params }),
  getById: (id) => api.get(`/munition/${id}`),
  create: (data) => api.post('/munition', data),
  update: (id, data) => api.put(`/munition/${id}`, data),
  delete: (id) => api.delete(`/munition/${id}`),
  getLowStock: () => api.get('/munition/alerts/low-stock'),
  getExpiring: () => api.get('/munition/alerts/expiring'),
  getStats: () => api.get('/munition/stats/overview'),
};

export const transactionsAPI = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  issue: (data) => api.post('/transactions/issue', data),
  return: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'documents' && data[key]) {
        // Handle multiple file uploads
        Array.from(data[key]).forEach(file => {
          formData.append('documents', file);
        });
      } else if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
      }
    });
    return api.post('/transactions/return', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getByOfficer: (officerId) => api.get(`/transactions/officer/${officerId}`),
  getOutstandingByOfficer: (officerId) => api.get(`/transactions/officer/${officerId}/outstanding`),
  downloadDocument: (filename) => api.get(`/transactions/documents/${encodeURIComponent(filename)}`, { responseType: 'blob' }),
  getUsedMaterials: (params = {}) => api.get('/transactions/used-materials', { params }),
  getStats: () => api.get('/transactions/stats/overview'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentTransactions: () => api.get('/dashboard/recent-transactions'),
  getAlerts: () => api.get('/dashboard/alerts'),
  getActivity: () => api.get('/dashboard/activity'),
  getInventoryBreakdown: () => api.get('/dashboard/inventory-breakdown'),
};

export const settingsAPI = {
  getSystem: () => api.get('/settings/system'),
  updateSystem: (data) => api.put('/settings/system', data),
  getUsers: () => api.get('/settings/users'),
  createUser: (data) => api.post('/settings/users', data),
  updateUser: (id, data) => api.put(`/settings/users/${id}`, data),
  deleteUser: (id) => api.delete(`/settings/users/${id}`),
  getBackupInfo: () => api.get('/settings/backup'),
  createBackup: () => api.post('/settings/backup'),
};

// Utility functions
export const uploadFile = (file, type = 'document') => {
  const formData = new FormData();
  formData.append(type, file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const downloadFile = (filename) => {
  return api.get(`/uploads/${filename}`, {
    responseType: 'blob'
  });
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;