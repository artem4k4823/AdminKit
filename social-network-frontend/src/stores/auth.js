import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('access_token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.isAdmin || false,
    currentUser: (state) => state.user
  },

  actions: {
    async login(username, password) {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await api.login(username, password);
        this.token = data.access_token.access_token;
        localStorage.setItem('access_token', this.token);
        
        await this.fetchUser();
        return true;
      } catch (error) {
        this.error = error.response?.data?.detail || 'Ошибка входа';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(username, password) {
      this.loading = true;
      this.error = null;
      
      try {
        await api.registerUser(username, password);
        return true;
      } catch (error) {
        this.error = error.response?.data?.detail || 'Ошибка регистрации';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchUser() {
      try {
        this.user = await api.getMe();
      } catch (error) {
        console.error('Ошибка получения данных пользователя:', error);
        this.logout();
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('access_token');
    }
  }
});
