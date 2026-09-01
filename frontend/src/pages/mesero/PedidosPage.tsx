import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, SquarePen, CircleX, CheckCheck, Bike } from 'lucide-react';
import { MeseroLayout } from '../../components/MeseroLayout';
import { Order, OrderStatus, OrderType, WaiterAlert } from '../../types';
import { ordersService } from '../../services/orders';
import { cashierService } from '../../services/cashierService';

const statusStyles: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  [OrderStatus.EN_PREPARACION]: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
  [OrderStatus.LISTO]: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  [OrderStatus.ENTREGADO]: 'border-slate-700 bg-slate-800/80 text-slate-200',
  [OrderStatus.CANCELADO]: 'border-red-500/30 bg-red-500/10 text-red-200',
};

const statusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'Pendiente',
  [OrderStatus.EN_PREPARACION]: 'En preparación',
  [OrderStatus.LISTO]: 'Listo para entregar',
  [OrderStatus.ENTREGADO]: 'Entregado',
  [OrderStatus.CANCELADO]: 'Cancelado',
};

export const PedidosPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<WaiterAlert[]>([]);

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== OrderStatus.ENTREGADO && order.status !== OrderStatus.CANCELADO),
    [orders]
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const [data, waiterAlerts] = await Promise.all([
        ordersService.getAll(),
        cashierService.getMyAlerts().catch(() => []),
      ]);
      setOrders(data);
      setAlerts(waiterAlerts);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await cashierService.resolveAlert(alertId);
      await loadOrders();
    } catch (err) {
      console.error(err);
      setError('No se pudo cerrar el aviso de caja');
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

  const confirmDelivery = async (order: Order) => {
    try {
      setActionLoading(order.id);
      await ordersService.updateStatus(order.id, OrderStatus.ENTREGADO);
      await loadOrders();
    } catch (err) {
      console.error(err);
      setError('No se pudo confirmar la entrega');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelOrder = async (order: Order) => {
    const motivo = window.prompt('Motivo de cancelación (opcional):') || undefined;

    try {
      setActionLoading(order.id);
      await ordersService.cancel(order.id, motivo);
      await loadOrders();
    } catch (err) {
      console.error(err);
      setError('No se pudo cancelar el pedido');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <MeseroLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Pedidos en curso</h1>
            <p className="mt-1 text-sm text-slate-400">Mesero crea, cocina prepara y aquí confirmas la entrega final al cliente</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={loadOrders} className="icon-button inline-flex items-center gap-2">
              <RefreshCw size={16} />
              Recargar
            </button>
            <button
              onClick={() => navigate('/mesero/domicilios')}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20"
            >
              <Bike size={16} />
              Ver domicilios
            </button>
            <button
              onClick={() => navigate('/mesero/pedidos/nuevo')}
              className="primary-button inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Nuevo pedido
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-200">{error}</div>
        )}

        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-100">Aviso de caja para mesa {alert.mesa_numero}</p>
                    <p className="mt-1 text-sm text-amber-200">{alert.message}</p>
                  </div>
                  <button
                    onClick={() => void resolveAlert(alert.id)}
                    className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500"
                  >
                    Marcar atendido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-400" />
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
            <p className="text-slate-300">No hay pedidos activos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeOrders.map((order) => (
              <article key={order.id} className="glass-card rounded-2xl p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Pedido #{order.id.slice(0, 8)}</p>
                    <h2 className="text-xl font-bold text-slate-100">
                      {order.tipo_pedido === OrderType.DOMICILIO ? order.cliente_nombre || 'Domicilio' : `Mesa ${order.mesa_numero}`}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {order.tipo_pedido === OrderType.DOMICILIO ? order.direccion_entrega : 'Servicio en mesa'}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[order.status]}`}>
                    {statusLabel[order.status]}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-300">
                  <p>{order.items.reduce((acc, item) => acc + item.cantidad, 0)} productos</p>
                  <p className="font-semibold text-emerald-300">Total: ${Number(order.total_amount).toFixed(2)}</p>
                  {order.notas ? <p className="text-xs text-slate-400">Nota: {order.notas}</p> : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/mesero/pedidos/${order.id}/editar`)}
                    disabled={order.status !== OrderStatus.PENDIENTE}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <SquarePen size={16} />
                    Editar
                  </button>

                  <button
                    onClick={() => cancelOrder(order)}
                    disabled={actionLoading === order.id || order.status === OrderStatus.ENTREGADO}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                  >
                    <CircleX size={16} />
                    Cancelar
                  </button>
                </div>

                <button
                  onClick={() => confirmDelivery(order)}
                  disabled={actionLoading === order.id || order.status !== OrderStatus.LISTO}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  <CheckCheck size={16} />
                  Confirmar entrega al cliente
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </MeseroLayout>
  );
};
