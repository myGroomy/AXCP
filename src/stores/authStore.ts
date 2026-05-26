import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('axcp-token', data.data.token);
      localStorage.setItem('axcp-refresh', data.data.refreshToken);
      localStorage.setItem('axcp-user', JSON.stringify(data.data.user));
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error ?? 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('axcp-token');
    localStorage.removeItem('axcp-refresh');
    localStorage.removeItem('axcp-user');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('axcp-token');
    const stored = localStorage.getItem('axcp-user');
    if (!token || !stored) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = JSON.parse(stored) as User;
      const { data } = await api.get('/auth/me');
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('axcp-token');
      localStorage.removeItem('axcp-refresh');
      localStorage.removeItem('axcp-user');
      set({ isLoading: false });
    }
  },
}));
