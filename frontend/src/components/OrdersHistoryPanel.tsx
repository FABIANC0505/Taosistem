import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, RefreshCw } from 'lucide-react';
import { ordersService } from '../services/orders';
import { OrderHistoryEntry, OrderHistoryResponse, OrderType, OrderStatus } from '../types';

const typeLabel: Record<OrderType, string> = {
  [OrderType.MESA]: 'Mesa',
  [OrderType.DOMICILIO]: 'Domicilio',
};

const statusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'Pendiente',
  [OrderStatus.EN_PREPARACION]: 'En preparación',
  [OrderStatus.LISTO]: 'Listo',
  [OrderStatus.ENTREGADO]: 'Entregado',
  [OrderStatus.CANCELADO]: 'Cancelado',
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return 'Sin dato';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

const formatDestination = (item: OrderHistoryEntry) => {
  if (item.tipo_pedido === OrderType.DOMICILIO) {
    return item.direccion_entrega || 'Sin dirección';
  }
  return item.mesa_numero ? `Mesa ${item.mesa_numero}` : 'Mesa sin definir';
};

export const OrdersHistoryPanel: React.FC = () => {
  const [history, setHistory] = useState<OrderHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const deliveredCount = useMemo(
    () => history?.items.filter((item) => item.status === OrderStatus.ENTREGADO).length || 0,
    [history]
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ordersService.getHistory(120);
      setHistory(response);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refresh = () => {
      void loadHistory();
    };

    refresh();
    const interval = setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Historial operativo</h1>
          <p className="mt-1 text-sm text-slate-400">Seguimiento de tiempos de preparación, entrega y domicilios</p>
        </div>

        <button
          onClick={loadHistory}
          className="icon-button inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Recargar
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-200">{error}</div>
      )}

      {history && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="panel-muted p-4">
            <p className="text-sm text-slate-400">Registros en historial</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{history.summary.total_registros}</p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-sm text-slate-400">Entregados visibles</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{deliveredCount}</p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-sm text-slate-400">Domicilios de la semana</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{history.summary.total_domicilios_semana}</p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-sm text-slate-400">Promedio preparación</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{formatDuration(history.summary.tiempo_promedio_preparacion_segundos)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-400" />
        </div>
      ) : !history || history.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
          <p className="text-slate-300">No hay registros cerrados en el historial.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {history.items.map((item) => (
            <article key={item.id} className="glass-card rounded-2xl p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">Pedido #{item.id.slice(0, 8)}</p>
                  <h2 className="text-lg font-bold text-slate-100">{formatDestination(item)}</h2>
                  <p className="mt-1 text-sm text-slate-400">{typeLabel[item.tipo_pedido]}</p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-200">
                  {statusLabel[item.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <p>
                  Total items: <span className="font-semibold text-slate-100">{item.total_items}</span>
                </p>
                <p>
                  Total: <span className="font-semibold text-slate-100">${Number(item.total_amount).toFixed(2)}</span>
                </p>
                <p>
                  Preparación: <span className="font-semibold text-slate-100">{formatDuration(item.tiempo_preparacion_segundos)}</span>
                </p>
                <p>
                  Tiempo total: <span className="font-semibold text-slate-100">{formatDuration(item.tiempo_total_segundos)}</span>
                </p>
              </div>

              <div className="space-y-1 text-sm text-slate-300">
                <p className="inline-flex items-center gap-1">
                  <Clock3 size={14} /> Creado: {item.created_at ? new Date(item.created_at).toLocaleString() : 'Sin dato'}
                </p>
                <p>En cocina: {item.cocinando_at ? new Date(item.cocinando_at).toLocaleString() : 'Sin dato'}</p>
                <p>Listo: {item.served_at ? new Date(item.served_at).toLocaleString() : 'Sin dato'}</p>
                <p>
                  Cierre: {item.entregado_at ? new Date(item.entregado_at).toLocaleString() : item.cancelado_at ? new Date(item.cancelado_at).toLocaleString() : 'Sin dato'}
                </p>
                {item.cliente_nombre ? (
                  <p>
                    Cliente: {item.cliente_nombre} {item.cliente_telefono ? `• ${item.cliente_telefono}` : ''}
                  </p>
                ) : null}
                {item.notas ? <p>Notas: {item.notas}</p> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
