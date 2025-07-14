// API Configuration
// Update this URL to match your backend server location

export const API_CONFIG = {
  // Local development (default)
  BASE_URL:'http://localhost:5000',
  
  // Production - Update this when deploying
  // BASE_URL: 'https://your-production-domain.com',
  
  // Alternative local URLs (uncomment if needed)
  // BASE_URL: 'http://127.0.0.1:5002',
  // BASE_URL: 'http://your-local-ip:5002', // For mobile testing
  
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Environment-based configuration
export const getBaseUrl = (): string => {
  // Check if we're in development or production
  if (import.meta.env.DEV) {
    // Development mode - use local backend
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  } else {
    // Production mode - use environment variable or fallback
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  }
};