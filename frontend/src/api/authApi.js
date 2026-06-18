import axiosInstance from '../services/axios';

export const authApi = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    // Optionally call backend logout endpoint, otherwise just local cleanup
    const response = await axiosInstance.post('/auth/logout').catch(() => {});
    return response?.data || { success: true };
  }
};
