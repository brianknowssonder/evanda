import axios from 'axios';

// API Configuration
export const API_BASE_URL = "http://localhost:5000";

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints matching Flask backend
export const endpoints = {
  // Authentication
  login: '/login',
  register: '/register',
  requestPasswordReset: '/request-password-reset',
  resetPassword: '/reset-password',
  
  // Events
  events: '/events',
  eventById: (id: number) => `/events/${id}`,
  
  // Tickets
  ticketById: (id: number) => `/tickets/${id}`,
  createTicketForEvent: (eventId: number) => `/events/${eventId}/tickets`,
  
  // Orders
  orders: '/orders',
  orderById: (id: number) => `/orders/${id}`,
  userOrders: '/user/orders',
  
  // Users
  users: '/users',
  userById: (id: number) => `/users/${id}`,
  toggleOrganizer: (id: number) => `/toggle-organizer/${id}`,
  
  // Payments
  mpesaPayment: '/api/mpesa_payment',
  
  // Tickets
  generateTicket: '/generate-ticket',
  validateTicket: '/validate-ticket',
  
  // Scanners
  addScanner: '/add-scanner',
  
  // Health
  health: '/health'
};

// Main API object with HTTP methods
export const api = {
  // Generic HTTP methods
  get: async (url: string) => {
    return await apiClient.get(url);
  },

  post: async (url: string, data?: any) => {
    return await apiClient.post(url, data);
  },

  put: async (url: string, data?: any) => {
    return await apiClient.put(url, data);
  },

  patch: async (url: string, data?: any) => {
    return await apiClient.patch(url, data);
  },

  delete: async (url: string) => {
    return await apiClient.delete(url);
  },

  // Authentication methods
  login: async (email: string, password: string) => {
    const response = await apiClient.post(endpoints.login, { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response;
  },

  register: async (userData: { 
    name: string; 
    email: string; 
    password: string; 
    phone_number: string;
    role?: string;
  }) => {
    const response = await apiClient.post(endpoints.register, userData);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response;
  },

  requestPasswordReset: async (email: string) => {
    return await apiClient.post(endpoints.requestPasswordReset, { email });
  },

  resetPassword: async (token: string, new_password: string) => {
    return await apiClient.post(endpoints.resetPassword, { token, new_password });
  },

  // Event methods
  getEvents: async () => {
    return await apiClient.get(endpoints.events);
  },

  getEventById: async (id: number) => {
    return await apiClient.get(endpoints.eventById(id));
  },

  createEvent: async (eventData: any) => {
    return await apiClient.post(endpoints.events, eventData);
  },

  updateEvent: async (id: number, eventData: any) => {
    return await apiClient.put(endpoints.eventById(id), eventData);
  },

  deleteEvent: async (id: number) => {
    return await apiClient.delete(endpoints.eventById(id));
  },

  // Order methods
  getOrders: async () => {
    return await apiClient.get(endpoints.orders);
  },

  getOrderById: async (id: number) => {
    return await apiClient.get(endpoints.orderById(id));
  },

  getUserOrders: async () => {
    return await apiClient.get(endpoints.userOrders);
  },

  createOrder: async (orderData: any) => {
    return await apiClient.post(endpoints.orders, orderData);
  },

  updateOrder: async (id: number, orderData: any) => {
    return await apiClient.patch(endpoints.orderById(id), orderData);
  },

  // Ticket methods
  getTicketById: async (id: number) => {
    return await apiClient.get(endpoints.ticketById(id));
  },

  createTicket: async (eventId: number, ticketData: any) => {
    return await apiClient.post(endpoints.createTicketForEvent(eventId), ticketData);
  },

  updateTicket: async (id: number, ticketData: any) => {
    return await apiClient.put(endpoints.ticketById(id), ticketData);
  },

  generateTicket: async (orderData: any) => {
    return await apiClient.post(endpoints.generateTicket, orderData);
  },

  validateTicket: async (qrData: any) => {
    return await apiClient.post(endpoints.validateTicket, qrData);
  },

  // User methods
  getUsers: async () => {
    return await apiClient.get(endpoints.users);
  },

  getUserById: async (id: number) => {
    return await apiClient.get(endpoints.userById(id));
  },

  updateUser: async (id: number, userData: any) => {
    return await apiClient.put(endpoints.userById(id), userData);
  },

  deleteUser: async (id: number) => {
    return await apiClient.delete(endpoints.userById(id));
  },

  toggleOrganizer: async (id: number, roleAction: 'on' | 'off') => {
    return await apiClient.patch(endpoints.toggleOrganizer(id), { role_action: roleAction });
  },

  // Scanner methods
  addScanner: async (scannerData: any) => {
    return await apiClient.post(endpoints.addScanner, scannerData);
  },

  // Health check
  health: async () => {
    return await apiClient.get(endpoints.health);
  },

  // M-Pesa payment
  initiateMpesaPayment: async (amount: number, phoneNumber: string, orderId: number) => {
    const formData = new FormData();
    formData.append('amount', amount.toString());
    formData.append('phone', phoneNumber);
    formData.append('order_id', orderId.toString());
    
    return await apiClient.post(endpoints.mpesaPayment, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// Enhanced API service with better error handling
export const apiService = {
  // Authentication
  login: async (email: string, password: string) => {
    try {
      return await api.login(email, password);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (userData: { 
    name: string; 
    email: string; 
    password: string; 
    phone_number: string;
    role?: string;
  }) => {
    try {
      return await api.register(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  requestPasswordReset: async (email: string) => {
    try {
      return await api.requestPasswordReset(email);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  },

  resetPassword: async (token: string, password: string) => {
    try {
      return await api.resetPassword(token, password);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  },

  // Events
  getEvents: async () => {
    try {
      return await api.getEvents();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch events');
    }
  },

  getEventById: async (id: number) => {
    try {
      return await api.getEventById(id);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event');
    }
  },

  createEvent: async (eventData: any) => {
    try {
      return await api.createEvent(eventData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  },

  updateEvent: async (id: number, eventData: any) => {
    try {
      return await api.updateEvent(id, eventData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update event');
    }
  },

  deleteEvent: async (id: number) => {
    try {
      return await api.deleteEvent(id);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete event');
    }
  },

  // Orders
  getOrders: async () => {
    try {
      return await api.getOrders();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  },

  getOrderById: async (id: number) => {
    try {
      return await api.getOrderById(id);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  },

  getUserOrders: async () => {
    try {
      return await api.getUserOrders();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user orders');
    }
  },

  createOrder: async (orderData: any) => {
    try {
      return await api.createOrder(orderData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  },

  updateOrder: async (id: number, orderData: any) => {
    try {
      return await api.updateOrder(id, orderData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update order');
    }
  },

  // Tickets
  getTicketById: async (id: number) => {
    try {
      return await api.getTicketById(id);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ticket');
    }
  },

  createTicketForEvent: async (eventId: number, ticketData: any) => {
    try {
      return await api.createTicket(eventId, ticketData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create ticket');
    }
  },

  updateTicket: async (id: number, ticketData: any) => {
    try {
      return await api.updateTicket(id, ticketData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update ticket');
    }
  },

  generateTicket: async (orderData: any) => {
    try {
      return await api.generateTicket(orderData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate ticket');
    }
  },

  validateTicket: async (qrData: any) => {
    try {
      return await api.validateTicket(qrData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate ticket');
    }
  },

  // Users
  getUsers: async () => {
    try {
      return await api.getUsers();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  getUserById: async (id: number) => {
    try {
      return await api.getUserById(id);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  updateUser: async (id: number, userData: any) => {
    try {
      return await api.updateUser(id, userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  deleteUser: async (id: number) => {
    try {
      return await api.deleteUser(id);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  toggleOrganizer: async (id: number, roleAction: 'on' | 'off') => {
    try {
      return await api.toggleOrganizer(id, roleAction);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle organizer role');
    }
  },

  // Scanners
  addScanner: async (scannerData: any) => {
    try {
      return await api.addScanner(scannerData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add scanner');
    }
  },

  // Health check
  health: async () => {
    try {
      return await api.health();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Health check failed');
    }
  }
};

// Helper function for M-Pesa payments
export const initiateMpesaPayment = async (amount: number, phoneNumber: string, orderId: number) => {
  try {
    return await api.initiateMpesaPayment(amount, phoneNumber, orderId);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'M-Pesa payment failed');
  }
};

// Export the api instance as default and named export for compatibility
export default api;