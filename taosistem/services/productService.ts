import api from '../utils/api';
import { Product } from '../types';

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products');
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: FormData): Promise<Product> => {
    const response = await api.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, data: FormData): Promise<Product> => {
    const response = await api.put(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  markAsOutOfStock: async (id: string): Promise<Product> => {
    const response = await api.put(`/products/${id}/mark-out-of-stock`);
    return response.data;
  },

  getByCategory: async (categoria: string): Promise<Product[]> => {
    const response = await api.get(`/products/category/${categoria}`);
    return response.data;
  },
};
