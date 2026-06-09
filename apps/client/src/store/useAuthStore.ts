import { create } from 'zustand';
import type { IUser } from '@hirenova/types';

interface AuthState {
  user: IUser | null;
  token: string | null;
  companyId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: IUser, token: string, companyId: string) => void;
  clearAuth: () => void;
}

const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('hn_token');
    const userJson = localStorage.getItem('hn_user');
    const companyId = localStorage.getItem('hn_companyId');
    if (token && userJson && companyId) {
      return {
        token,
        companyId,
        user: JSON.parse(userJson),
        isAuthenticated: true
      };
    }
  } catch (err) {
    console.error('Failed to parse stored auth', err);
  }
  return {
    user: null,
    token: null,
    companyId: null,
    isAuthenticated: false
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getStoredAuth(),
  setAuth: (user, token, companyId) => {
    localStorage.setItem('hn_token', token);
    localStorage.setItem('hn_user', JSON.stringify(user));
    localStorage.setItem('hn_companyId', companyId);
    set({ user, token, companyId, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem('hn_token');
    localStorage.removeItem('hn_user');
    localStorage.removeItem('hn_companyId');
    set({ user: null, token: null, companyId: null, isAuthenticated: false });
  },
}));
