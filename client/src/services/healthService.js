/**
 * Health Check API Service
 */
import apiClient from './api';

export const checkApiHealth = async () => {
  return apiClient.get('/health');
};

export const checkFullApiHealth = async () => {
  return apiClient.get('/health/full');
};
