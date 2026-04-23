import api from '../utils/api';
import type { User, LoginRequest, AuthResponse } from '../types';
import { authStorage } from '../utils/authStorage';

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: () => {
    authStorage.clear();
  },

  getCurrentUser: (): User | null => {
    try {
      const user = authStorage.getUser();
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!authStorage.getToken() && !!authService.getCurrentUser();
  },

  saveAuth: (token: string, user: User) => {
    authStorage.setAuth(token, JSON.stringify(user));
  },
};
