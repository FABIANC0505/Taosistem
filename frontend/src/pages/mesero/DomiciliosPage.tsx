import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, MapPin, Plus, RefreshCw } from 'lucide-react';
import { MeseroLayout } from '../../components/MeseroLayout';
import { ordersService } from '../../services/orders';
import { Order, OrderHistoryResponse, OrderStatus, OrderType } from '../../types';

const statusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'Pendiente',
  [OrderStatus.EN_PREPARACION]: 'En preparación',
  [OrderStatus.LISTO]: 'Listo para salir',
  [OrderStatus.ENTREGADO]: 'Entregado',
  [OrderStatus.CANCELADO]: 'Cancelado',
};

export const DomiciliosPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<OrderHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const domicilios = useMemo(
    () => orders.filter((order) => order.tipo_pedido === OrderType.DOMICILIO),
    [orders]
  );

  const activeDomicilios = useMemo(
    () => domicilios.filter((order) => order.status !== OrderStatus.ENTREGADO && order.status !== OrderStatus.CANCELADO),
    [domicilios]
  );

  const recentDelivered = useMemo(
    () => history?.items.filter((item) => item.tipo_pedido === OrderType.DOMICILIO && item.status === OrderStatus.ENTREGADO).slice(0, 8) || [],
    [history]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [ordersResponse, historyResponse] = await Promise.all([
        ordersService.getAll(),
        ordersService.getHistory(120).catch(() => null),
      ]);
      setOrders(ordersResponse);
      setHistory(historyResponse);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los domicilios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refresh = () => {
      void loadData();
    };

    refresh();
    const interval = setInterval(refresh, 3000);
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return (
    <MeseroLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Domicilios</h1>
            <p className="mt-1 text-sm text-slate-400">Control semanal de salidas y seguimiento de entregas a domicilio</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={loadData} className="icon-button inline-flex items-center gap-2">
              <RefreshCw size={16} />
              Recargar
            </button>
            <button
              onClick={() => navigate('/mesero/pedidos/nuevo?tipo=domicilio')}
              className="primary-button inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Nuevo domicilio
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-200">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="panel-muted p-4">
            <p className="text-sm text-slate-400">Domicilios activos</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{activeDomicilios.length}</p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-sm text-slate-400">Domicilios visibles en historial semanal</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{history?.summary.total_domicilios_semana || 0}</p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-sm text-slate-400">Historial reciente</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{recentDelivered.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="glass-card rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-slate-100">
                <Bike size={18} />
                <h2 className="font-semibold">Domicilios en curso</h2>
              </div>

              {activeDomicilios.length === 0 ? (
                <p className="text-sm text-slate-400">No hay domicilios activos.</p>
              ) : (
                <div className="space-y-3">
                  {activeDomicilios.map((order) => (
                    <article key={order.id} className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-400">Pedido #{order.id.slice(0, 8)}</p>
                          <h3 className="font-semibold text-slate-100">{order.cliente_nombre || 'Cliente sin nombre'}</h3>
                          <p className="text-sm text-slate-300">{statusLabel[order.status]}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/mesero/pedidos/${order.id}/editar`)}
                          className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                        >
                          Ver detalle
                        </button>
                      </div>
                      <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-300">
                        <MapPin size={14} />
                        {order.direccion_entrega || 'Sin dirección registrada'}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">{order.cliente_telefono || 'Sin teléfono'}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="glass-card rounded-2xl p-4 space-y-4">
              <h2 className="font-semibold text-slate-100">Últimos domicilios entregados</h2>
              {recentDelivered.length === 0 ? (
                <p className="text-sm text-slate-400">Aún no hay domicilios entregados en el historial visible.</p>
              ) : (
                <div className="space-y-3">
                  {recentDelivered.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-700 bg-slate-950/40 p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-100">{item.cliente_nombre || 'Cliente sin nombre'}</p>
                          <p className="text-slate-300">{item.direccion_entrega || 'Sin dirección'}</p>
                        </div>
                        <span className="text-slate-400">{item.entregado_at ? new Date(item.entregado_at).toLocaleDateString() : 'Sin fecha'}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-slate-300">
                        <span>${Number(item.total_amount).toFixed(2)}</span>
                        <span>Tiempo total: {item.tiempo_total_segundos ? `${Math.round(item.tiempo_total_segundos / 60)} min` : 'Sin dato'}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </MeseroLayout>
  );
};
