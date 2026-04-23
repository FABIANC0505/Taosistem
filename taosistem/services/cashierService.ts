import api from '../utils/api';
import { CashierSummary, CashMovement, CashMovementType, CashPayment, CashSession, PaymentMethod, WaiterAlert } from '../types';

export const cashierService = {
  getSummary: async (): Promise<CashierSummary> => {
    const response = await api.get('/cashier/summary');
    return response.data;
  },

  getCurrentSession: async (): Promise<CashSession | null> => {
    const response = await api.get('/cashier/session/current');
    return response.data;
  },

  openSession: async (opening_amount: number, opening_note?: string): Promise<CashSession> => {
    const response = await api.post('/cashier/session/open', { opening_amount, opening_note });
    return response.data;
  },

  closeSession: async (counted_amount: number, closing_note?: string): Promise<CashSession> => {
    const response = await api.post('/cashier/session/close', { counted_amount, closing_note });
    return response.data;
  },

  getMovements: async (): Promise<CashMovement[]> => {
    const response = await api.get('/cashier/movements');
    return response.data;
  },

  createMovement: async (payload: {
    movement_type: CashMovementType;
    amount: number;
    description: string;
    related_order_id?: string;
  }): Promise<CashMovement> => {
    const response = await api.post('/cashier/movements', payload);
    return response.data;
  },

  getPayments: async (): Promise<CashPayment[]> => {
    const response = await api.get('/cashier/payments');
    return response.data;
  },

  createPayment: async (payload: {
    amount: number;
    payment_method: PaymentMethod;
    order_id?: string;
    mesa_numero?: number;
    reference_note?: string;
  }): Promise<CashPayment> => {
    const response = await api.post('/cashier/payments', payload);
    return response.data;
  },

  getAlerts: async (): Promise<WaiterAlert[]> => {
    const response = await api.get('/cashier/alerts');
    return response.data;
  },

  getMyAlerts: async (): Promise<WaiterAlert[]> => {
    const response = await api.get('/cashier/alerts/my');
    return response.data;
  },

  createAlert: async (mesa_numero: number, message: string): Promise<WaiterAlert> => {
    const response = await api.post('/cashier/alerts', { mesa_numero, message });
    return response.data;
  },

  resolveAlert: async (alertId: string): Promise<WaiterAlert> => {
    const response = await api.put(`/cashier/alerts/${alertId}/resolve`);
    return response.data;
  },
};
