// Tipos de usuario
export enum UserRole {
  ADMIN = 'admin',
  MESERO = 'mesero',
  COCINA = 'cocina',
  CAJERO = 'cajero',
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

export enum OrderType {
  MESA = 'mesa',
  DOMICILIO = 'domicilio',
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
  mesa_numero?: number;
  tipo_pedido: OrderType;
  cliente_nombre?: string;
  cliente_telefono?: string;
  direccion_entrega?: string;
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
  domicilios_semana: number;
  tiempo_promedio_preparacion_segundos: number;
  tiempo_promedio_entrega_segundos: number;
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

export interface OrderHistoryEntry {
  id: string;
  tipo_pedido: OrderType;
  mesa_numero?: number;
  cliente_nombre?: string;
  cliente_telefono?: string;
  direccion_entrega?: string;
  status: OrderStatus;
  total_amount: number;
  created_at?: string;
  cocinando_at?: string;
  served_at?: string;
  entregado_at?: string;
  cancelado_at?: string;
  notas?: string;
  total_items: number;
  tiempo_hasta_preparacion_segundos?: number;
  tiempo_preparacion_segundos?: number;
  tiempo_total_segundos?: number;
}

export interface OrderHistorySummary {
  total_registros: number;
  total_domicilios_semana: number;
  tiempo_promedio_preparacion_segundos: number;
  tiempo_promedio_total_segundos: number;
}

export interface OrderHistoryResponse {
  summary: OrderHistorySummary;
  items: OrderHistoryEntry[];
}

export enum CashMovementType {
  SALIDA = 'salida',
  SERVICIO_CANCELADO = 'servicio_cancelado',
  PAGO_PRODUCTO = 'pago_producto',
  OTRO = 'otro',
}

export interface CashSession {
  id: string;
  cashier_user_id: string;
  opening_amount: number;
  opening_note?: string;
  opened_at?: string;
  closed_at?: string;
  is_open: boolean;
  closing_counted_amount?: number | null;
  closing_note?: string | null;
}

export interface CashMovement {
  id: string;
  session_id: string;
  cashier_user_id: string;
  movement_type: CashMovementType;
  amount: number;
  description: string;
  related_order_id?: string | null;
  created_at?: string;
}

export enum PaymentMethod {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  TARJETA = 'tarjeta',
  NEQUI = 'nequi',
  DAVIPLATA = 'daviplata',
  OTRO = 'otro',
}

export interface CashPayment {
  id: string;
  session_id: string;
  cashier_user_id: string;
  order_id?: string | null;
  mesa_numero?: number | null;
  payment_method: PaymentMethod;
  amount: number;
  reference_note?: string | null;
  created_at?: string;
}

export interface PaymentMethodSummary {
  payment_method: PaymentMethod;
  total_amount: number;
  transactions: number;
}

export interface WaiterAlert {
  id: string;
  mesa_numero: number;
  cashier_user_id: string;
  mesero_user_id?: string | null;
  message: string;
  resolved: boolean;
  created_at?: string;
  resolved_at?: string | null;
}

export interface CashTableSummaryItem {
  mesa_numero: number;
  libre: boolean;
  order_id?: string | null;
  status?: string | null;
  total_amount?: number | null;
  mesero_id?: string | null;
  mesero_nombre?: string | null;
  created_at?: string | null;
}

export interface CashierSummary {
  total_mesas: number;
  mesas_ocupadas: CashTableSummaryItem[];
  mesas_libres: CashTableSummaryItem[];
  active_alerts: WaiterAlert[];
  open_session?: CashSession | null;
  recent_payments: CashPayment[];
  payment_summary: PaymentMethodSummary[];
}
