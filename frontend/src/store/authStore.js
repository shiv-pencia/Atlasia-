import { create } from 'zustand';
import { authApi } from '../api/authApi';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(credentials);
      localStorage.setItem('token', data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false
      });
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.register(userData);
      localStorage.setItem('token', data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false
      });
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  fetchCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    set({ isLoading: true, error: null });
    try {
      const data = await authApi.getCurrentUser();
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false
      });
      return data.user;
    } catch (err) {
      // If auth token is invalid
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
      return null;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch (err) {
      // Log error but continue local logout anyway
      console.error('Logout request failed', err);
    } finally {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },

  clearError: () => set({ error: null })
}));
