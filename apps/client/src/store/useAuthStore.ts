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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  companyId: null,
  isAuthenticated: false,
  setAuth: (user, token, companyId) => set({ user, token, companyId, isAuthenticated: true }),
  clearAuth: () => set({ user: null, token: null, companyId: null, isAuthenticated: false }),
}));
