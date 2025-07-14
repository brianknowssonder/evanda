import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Helper function to check token validity
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Request interceptor with proper typing and null checks
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    console.log(token);
    // const noAuthUrls = ['/login', '/register', '/request-password-reset', '/reset-password'];

    // // Skip auth header for public endpoints
    // if (config.url && noAuthUrls.some(url => config.url.includes(url))) {
    //   return config;
    // }

    if (token) {
      if (!isTokenValid(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // if (window.location.pathname !== '/login') {
        //   window.location.href = '/login';
        // }
        // Do not throw error here
        return Promise.reject(new axios.Cancel('Token expired'));
      }
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // if (window.location.pathname !== '/login') {
      //   window.location.href = '/login';
      // }
      // Do not throw error here
      return Promise.reject(new axios.Cancel('No authentication token found'));
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Here you could add token refresh logic if available
      // const newToken = await refreshToken();
      // if (newToken) {
      //   localStorage.setItem('token', newToken);
      //   return api(originalRequest);
      // }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
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
  mpesaPayment: '/mpesa_payment',

  // Tickets
  generateTicket: '/generate-ticket',
  validateTicket: '/validate-ticket',

  // Scanners
  addScanner: '/add-scanner',

  // Health
  health: '/health'
};

// Helper function for M-Pesa payments
export const initiateMpesaPayment = async (amount: number, phoneNumber: string, orderId: number): Promise<AxiosResponse> => {
  const formData = new FormData();
  formData.append('amount', amount.toString());
  formData.append('phone', phoneNumber);
  formData.append('order_id', orderId.toString());

  return api.post(endpoints.mpesaPayment, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// API service with typed methods
export const apiService = {
  // Authentication
  login: (email: string, password: string): Promise<AxiosResponse> =>
    api.post(endpoints.login, { email, password }),

  register: (
    name: string,
    email: string,
    password: string,
    phone: string
  ): Promise<AxiosResponse> =>
    api.post(endpoints.register, { name, email, password, phone_number: phone }),

  // Events
  getEvents: (): Promise<AxiosResponse> => api.get(endpoints.events),
  getEventById: (id: number): Promise<AxiosResponse> => api.get(endpoints.eventById(id)),
  createEvent: (eventData: any): Promise<AxiosResponse> => api.post(endpoints.events, eventData),
  updateEvent: (id: number, eventData: any): Promise<AxiosResponse> => 
    api.put(endpoints.eventById(id), eventData),
  deleteEvent: (id: number): Promise<AxiosResponse> => api.delete(endpoints.eventById(id)),

  // Orders
  createOrder: (orderData: any): Promise<AxiosResponse> => api.post(endpoints.orders, orderData),
  getUserOrders: (): Promise<AxiosResponse> => api.get(endpoints.userOrders),
  getOrderById: (id: number): Promise<AxiosResponse> => api.get(endpoints.orderById(id)),

  // Users
  getUsers: (): Promise<AxiosResponse> => api.get(endpoints.users),
  getUserById: (id: number): Promise<AxiosResponse> => api.get(endpoints.userById(id)),
  updateUser: (id: number, userData: any): Promise<AxiosResponse> => 
    api.put(endpoints.userById(id), userData),
  deleteUser: (id: number): Promise<AxiosResponse> => api.delete(endpoints.userById(id)),
  toggleOrganizerRole: (id: number, action: 'on' | 'off'): Promise<AxiosResponse> =>
    api.patch(endpoints.toggleOrganizer(id), { role_action: action }),

  // Tickets
  generateTicket: (orderId: number): Promise<AxiosResponse> =>
    api.post(endpoints.generateTicket, { order_id: orderId }),

  // Health check
  healthCheck: (): Promise<AxiosResponse> => api.get(endpoints.health),

  // Payments
  initiateMpesaPayment,
};

export default api;