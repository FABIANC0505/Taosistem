import api from '../utils/api';
import { Order, OrderHistoryResponse, OrderStatus, OrderType } from '../types';

export interface OrderItemPayload {
  product_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export interface CreateOrderPayload {
  mesa_numero?: number;
  tipo_pedido: OrderType;
  cliente_nombre?: string;
  cliente_telefono?: string;
  direccion_entrega?: string;
  items: OrderItemPayload[];
  notas?: string;
}

export interface UpdateOrderPayload {
  mesa_numero?: number;
  tipo_pedido?: OrderType;
  cliente_nombre?: string;
  cliente_telefono?: string;
  direccion_entrega?: string;
  items?: OrderItemPayload[];
  notas?: string;
}

export const ordersService = {
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data;
  },

  getById: async (orderId: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  getHistory: async (limit: number = 100): Promise<OrderHistoryResponse> => {
    const response = await api.get('/orders/history', { params: { limit } });
    return response.data;
  },

  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const response = await api.post('/orders', payload);
    return response.data;
  },

  update: async (orderId: string, payload: UpdateOrderPayload): Promise<Order> => {
    const response = await api.put(`/orders/${orderId}`, payload);
    return response.data;
  },

  updateStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  cancel: async (orderId: string, motivo_cancelacion?: string): Promise<Order> => {
    const response = await api.put(`/orders/${orderId}/cancel`, {
      motivo_cancelacion,
    });
    return response.data;
  },

  delete: async (orderId: string): Promise<void> => {
    await api.delete(`/orders/${orderId}`);
  },
};
