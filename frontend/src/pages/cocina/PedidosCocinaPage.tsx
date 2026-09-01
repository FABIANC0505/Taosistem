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
  [OrderStatus.PENDIENTE]: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  [OrderStatus.EN_PREPARACION]: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
  [OrderStatus.LISTO]: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  [OrderStatus.ENTREGADO]: 'border-slate-700 bg-slate-800/80 text-slate-200',
  [OrderStatus.CANCELADO]: 'border-red-500/30 bg-red-500/10 text-red-200',
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
            <h1 className="text-2xl font-bold text-slate-100">Órdenes de cocina</h1>
            <p className="mt-1 text-sm text-slate-400">Recibe pedidos nuevos, inicia preparación y marca cuando estén listos</p>
          </div>

          <button onClick={loadOrders} className="icon-button inline-flex items-center gap-2">
            <RefreshCw size={16} />
            Recargar
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-200">{error}</div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-400" />
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
            <p className="text-slate-300">No hay pedidos activos para cocina.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeOrders.map((order) => (
              <article key={order.id} className="glass-card rounded-2xl p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Pedido #{order.id.slice(0, 8)}</p>
                    <h2 className="text-xl font-bold text-slate-100">
                      {order.tipo_pedido === OrderType.DOMICILIO ? 'Domicilio' : `Mesa ${order.mesa_numero}`}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {order.tipo_pedido === OrderType.DOMICILIO ? order.direccion_entrega : 'Consumo en mesa'}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadge[order.status]}`}>
                    {statusLabel[order.status]}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-300">
                  <p className="inline-flex items-center gap-1">
                    <Clock3 size={14} /> {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                  <p>{order.items.reduce((acc, item) => acc + item.cantidad, 0)} productos</p>
                  <p className="font-semibold text-emerald-300">Total: ${Number(order.total_amount).toFixed(2)}</p>
                  {order.notas ? <p className="text-xs text-slate-400">Nota: {order.notas}</p> : null}
                </div>

                <ul className="space-y-1 text-sm text-slate-300">
                  {order.items.map((item, idx) => (
                    <li key={`${item.product_id}-${idx}`} className="flex justify-between">
                      <span>
                        {item.cantidad}x {item.nombre}
                      </span>
                      <span>${Number(item.precio_unitario).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateStatus(order.id, OrderStatus.EN_PREPARACION)}
                    disabled={actionLoading === order.id || order.status !== OrderStatus.PENDIENTE}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    <ChefHat size={16} />
                    Tomar pedido
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, OrderStatus.LISTO)}
                    disabled={actionLoading === order.id || order.status !== OrderStatus.EN_PREPARACION}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
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
