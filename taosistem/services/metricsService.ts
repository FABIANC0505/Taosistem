import api from '../utils/api';
import { DispatchedHistory, Metrics } from '../types';

export const metricsService = {
  getDashboard: async (): Promise<Metrics> => {
    const response = await api.get('/metrics/dashboard');
    return response.data;
  },

  getIncomeTrends: async (days: number = 30): Promise<Array<{ fecha: string; ingresos: number }>> => {
    const response = await api.get(`/metrics/income-trends`, { params: { days } });
    return response.data;
  },

  getTopProducts: async (limit: number = 10): Promise<Array<{ nombre: string; cantidad: number; ingresos: number }>> => {
    const response = await api.get(`/metrics/top-products`, { params: { limit } });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/metrics/statistics');
    return response.data;
  },

  getDispatchedHistory: async (): Promise<DispatchedHistory> => {
    const response = await api.get('/metrics/dispatched-history');
    return response.data;
  },
};
