'use client';
import { create } from 'zustand';
import { authApi } from '@/services/api';

interface AdminUser { id: string; name: string; email: string; }

interface AuthState {
  token: string | null;
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  admin: null,
  isLoading: false,

  init: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('admin_token');
    const adminStr = localStorage.getItem('admin_user');
    if (token && adminStr) {
      set({ token, admin: JSON.parse(adminStr) });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ email, password });
      const { access_token, admin } = res.data.data;
      localStorage.setItem('admin_token', access_token);
      localStorage.setItem('admin_user', JSON.stringify(admin));
      set({ token: access_token, admin, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ token: null, admin: null });
  },
}));
