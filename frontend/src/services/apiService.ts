import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // This should match your backend server URL

// Create an Axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token to all requests
apiClient.interceptors.request.use(
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

// Response interceptor to handle token expiration and other errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token might be expired, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const authAPI = {
  login: (email: string, password: string) => {
    // Backend uses OAuth2 form-based login with 'username' field
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },

  register: (email: string, password: string, company_name: string, industry: string = 'General') =>
    apiClient.post('/auth/register', { email, password, company_name, industry }),

  getCurrentUser: () =>
    apiClient.get('/auth/me'),

  logout: () =>
    apiClient.post('/auth/logout'),
};

// Inventory endpoints
export const inventoryAPI = {
  getProducts: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/inventory/products/', { params }),

  getProductById: (id: number) =>
    apiClient.get(`/inventory/products/${id}`),

  createProduct: (data: any) =>
    apiClient.post('/inventory/products/', data),

  updateProduct: (id: number, data: any) =>
    apiClient.put(`/inventory/products/${id}`, data),

  deleteProduct: (id: number) =>
    apiClient.delete(`/inventory/products/${id}`),

  getInventoryItems: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/inventory/items/', { params }),

  getInventoryItemById: (id: number) =>
    apiClient.get(`/inventory/items/${id}`),

  createInventoryItem: (data: any) =>
    apiClient.post('/inventory/items/', data),

  updateInventoryItem: (id: number, data: any) =>
    apiClient.put(`/inventory/items/${id}`, data),

  deleteInventoryItem: (id: number) =>
    apiClient.delete(`/inventory/items/${id}`),
};

// Supplier endpoints
export const supplierAPI = {
  getSuppliers: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/suppliers/', { params }),

  getSupplierById: (id: number) =>
    apiClient.get(`/suppliers/${id}`),

  createSupplier: (data: any) =>
    apiClient.post('/suppliers/', data),

  updateSupplier: (id: number, data: any) =>
    apiClient.put(`/suppliers/${id}`, data),

  deleteSupplier: (id: number) =>
    apiClient.delete(`/suppliers/${id}`),

  getShipments: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/suppliers/shipments/', { params }),

  getShipmentById: (id: number) =>
    apiClient.get(`/suppliers/shipments/${id}`),

  createShipment: (data: any) =>
    apiClient.post('/suppliers/shipments/', data),

  updateShipment: (id: number, data: any) =>
    apiClient.put(`/suppliers/shipments/${id}`, data),

  deleteShipment: (id: number) =>
    apiClient.delete(`/suppliers/shipments/${id}`),
};

// Order endpoints
export const orderAPI = {
  getOrders: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/orders/', { params }),

  getOrderById: (id: number) =>
    apiClient.get(`/orders/${id}`),

  createOrder: (data: any) =>
    apiClient.post('/orders/', data),

  updateOrder: (id: number, data: any) =>
    apiClient.put(`/orders/${id}`, data),

  deleteOrder: (id: number) =>
    apiClient.delete(`/orders/${id}`),
};

// ML endpoints
export const mlAPI = {
  getInsights: (params?: { severity?: string; category?: string; status?: string; limit?: number }) =>
    apiClient.get('/ml/insights', { params }),

  getActionRequiredInsights: () =>
    apiClient.get('/ml/insights/action-required'),

  acknowledgeInsight: (id: number) =>
    apiClient.post(`/ml/insights/${id}/acknowledge`),

  resolveInsight: (id: number) =>
    apiClient.post(`/ml/insights/${id}/resolve`),

  runAnalysis: () =>
    apiClient.post('/ml/run-analysis'),

  getPredictions: (params?: { entity_type?: string; prediction_type?: string; limit?: number }) =>
    apiClient.get('/ml/predictions', { params }),

  getDemandForecast: (productId: number, date: string) =>
    apiClient.get(`/ml/demand-forecast/${productId}?date=${date}`),

  getInventoryRisk: (productId: number) =>
    apiClient.get(`/ml/inventory-risk/${productId}`),

  getSupplierDelayRisk: (supplierId: number) =>
    apiClient.get(`/ml/supplier-delay-risk/${supplierId}`),
};

// Data endpoints
export const dataAPI = {
  uploadData: (formData: FormData) =>
    apiClient.post('/api/upload/data', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

// Settings endpoints
export const settingsAPI = {
  getUserProfile: () =>
    apiClient.get('/auth/me'), // Reusing auth endpoint for user info

  updateProfile: (data: any) =>
    apiClient.put('/auth/me', data),
};

export default apiClient;