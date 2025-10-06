import { api } from './index';

export const authAPI = {
  // Login user
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  // Register user
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  // Get current user
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  // Logout user (client-side)
  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
