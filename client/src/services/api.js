/**
 * Centralized Axios API Client
 * Configures base URL, timeout, headers, and standard error handling.
 */
import axios from 'axios';

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Phase 2: Attach JWT Authorization headers here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for centralized error normalization
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      success: false,
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred',
      statusCode: error.response?.status || 500,
      details: error.response?.data || null,
    };

    console.error(`[API Error ${customError.statusCode}]:`, customError.message);
    return Promise.reject(customError);
  }
);

export default apiClient;
