import api from '../utils/api';
import { HistoryRetentionSettings } from '../types';

export const settingsService = {
  getHistoryRetention: async (): Promise<HistoryRetentionSettings> => {
    const response = await api.get('/settings/history-retention');
    return response.data;
  },

  updateHistoryRetention: async (retention_days: number): Promise<HistoryRetentionSettings> => {
    const response = await api.put('/settings/history-retention', { retention_days });
    return response.data;
  },
};
