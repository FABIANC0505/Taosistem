"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Clock3, ChefHat, BellRing } from 'lucide-react';
import { CocinaLayout } from '../../components/CocinaLayout';
import { ordersService } from '../../services/orders';
import { Order, OrderStatus, OrderType } from '../../types';

const statusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'Pendiente',
  [OrderStatus.EN_PREPARACION]: 'En preparación',
  [OrderStatus.LISTO]: 'Listo',
  [OrderStatus.ENTREGADO]: 'Entregado',
  [OrderStatus.CANCELADO]: 'Cancelado',
};

const statusBadge: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'bg-amber-100 text-amber-800 border-amber-200',
  [OrderStatus.EN_PREPARACION]: 'bg-blue-100 text-blue-800 border-blue-200',
  [OrderStatus.LISTO]: 'bg-green-100 text-green-800 border-green-200',
  [OrderStatus.ENTREGADO]: 'bg-gray-100 text-gray-700 border-gray-200',
  [OrderStatus.CANCELADO]: 'bg-red-100 text-red-700 border-red-200',
};

export const PedidosCocinaPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== OrderStatus.CANCELADO && order.status !== OrderStatus.ENTREGADO),
    [orders]
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ordersService.getAll();
      setOrders(response);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los pedidos de cocina');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refresh = () => {
      void loadOrders();
    };

    refresh();
    const interval = setInterval(refresh, 3000);
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setActionLoading(orderId);
      await ordersService.updateStatus(orderId, nextStatus);
      await loadOrders();
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el estado del pedido');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <CocinaLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Órdenes de cocina</h1>
            <p className="text-sm text-gray-600 mt-1">Recibe pedidos nuevos, inicia preparación y marca cuando estén listos</p>
          </div>

          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Recargar
          </button>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="p-10 text-center rounded-xl border border-dashed border-gray-300 bg-white">
            <p className="text-gray-600">No hay pedidos activos para cocina.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
              <article key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
                    <h2 className="text-xl font-bold text-gray-900">
                      {order.tipo_pedido === OrderType.DOMICILIO ? 'Domicilio' : `Mesa ${order.mesa_numero}`}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.tipo_pedido === OrderType.DOMICILIO ? order.direccion_entrega : 'Consumo en mesa'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full border font-medium ${statusBadge[order.status]}`}>
                    {statusLabel[order.status]}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-700">
                  <p className="inline-flex items-center gap-1"><Clock3 size={14} /> {new Date(order.created_at).toLocaleTimeString()}</p>
                  <p>{order.items.reduce((acc, item) => acc + item.cantidad, 0)} productos</p>
                  <p className="font-semibold text-primary-700">Total: ${Number(order.total_amount).toFixed(2)}</p>
                  {order.notas ? <p className="text-xs text-gray-500">Nota: {order.notas}</p> : null}
                </div>

                <ul className="space-y-1 text-sm">
                  {order.items.map((item, idx) => (
                    <li key={`${item.product_id}-${idx}`} className="flex justify-between text-gray-700">
                      <span>{item.cantidad}x {item.nombre}</span>
                      <span>${Number(item.precio_unitario).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateStatus(order.id, OrderStatus.EN_PREPARACION)}
                    disabled={actionLoading === order.id || order.status !== OrderStatus.PENDIENTE}
                    className="inline-flex justify-center items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                  >
                    <ChefHat size={16} />
                    Tomar pedido
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, OrderStatus.LISTO)}
                    disabled={actionLoading === order.id || order.status !== OrderStatus.EN_PREPARACION}
                    className="inline-flex justify-center items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                  >
                    <BellRing size={16} />
                    Marcar listo
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </CocinaLayout>
  );
};

export default PedidosCocinaPage;
