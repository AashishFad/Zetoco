/**
 * Centralized Axios API Client
 * Configures base URL, timeout, headers, and standard error handling.
 * Automatically attaches Supabase Auth JWT token to requests.
 */
import axios from 'axios';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Supabase JWT bearer token if available
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (isSupabaseConfigured()) {
        let { data: { session } } = await supabase.auth.getSession();
        if (session && session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
          try {
            const { data: refreshed } = await supabase.auth.refreshSession();
            if (refreshed?.session) {
              session = refreshed.session;
            }
          } catch (refreshErr) {
            console.warn('Could not refresh Supabase session:', refreshErr);
          }
        }
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      }
    } catch (err) {
      console.warn('Could not attach Supabase session token to API request:', err);
    }
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
