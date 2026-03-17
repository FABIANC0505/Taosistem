// Tipos de usuario
export enum UserRole {
  ADMIN = 'admin',
  MESERO = 'mesero',
  COCINA = 'cocina',
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Tipos de productos
export interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  imagen_url?: string;
  categoria: string;
  disponible: boolean;
  agotado_por?: string;
  agotado_at?: string;
  created_at: string;
  updated_at: string;
}

// Tipos de órdenes
export enum OrderStatus {
  PENDIENTE = 'pendiente',
  EN_PREPARACION = 'en_preparacion',
  LISTO = 'listo',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

export interface OrderItem {
  product_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export interface Order {
  id: string;
  id_mesero: string;
  mesa_numero: number;
  status: OrderStatus;
  items: OrderItem[];
  notas?: string;
  total_amount: number;
  created_at: string;
  cocinando_at?: string;
  served_at?: string;
  entregado_at?: string;
  cancelado_at?: string;
  cancelado_por?: string;
  motivo_cancelacion?: string;
}

// Tipos de métricas
export interface Metrics {
  total_ingresos: number;
  total_ordenes: number;
  ordenes_hoy: number;
  productos_agotados: number;
  producto_mas_vendido: {
    nombre: string;
    cantidad: number;
  };
  media_ingresos: number;
  moda_ingresos: number;
  ingresos_por_dia: Array<{ fecha: string; ingresos: number }>;
  productos_top: Array<{ nombre: string; cantidad: number; ingresos: number }>;
  dispatched_por_dia: Array<{ fecha: string; cantidad: number }>;
  dispatched_por_mes: Array<{ mes: string; cantidad: number }>;
}

export interface DispatchedHistory {
  retention_days: number;
  dispatched_por_dia: Array<{ fecha: string; cantidad: number }>;
  dispatched_por_mes: Array<{ mes: string; cantidad: number }>;
}

export interface HistoryRetentionSettings {
  retention_days: number;
}
