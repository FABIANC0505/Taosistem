import api from '../utils/api';
import { User, UserRole } from '../types';

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: { nombre: string; email: string; password: string; rol: UserRole }): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  updateRole: async (id: string, rol: UserRole): Promise<User> => {
    const response = await api.put(`/users/${id}/role`, null, {
      params: { rol },
    });
    return response.data;
  },

  deactivate: async (id: string): Promise<User> => {
    const response = await api.put(`/users/${id}/deactivate`);
    return response.data;
  },
};
