"use client";

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
          <h1 className="text-2xl font-bold text-gray-900">Historial operativo</h1>
          <p className="text-sm text-gray-600 mt-1">Seguimiento de tiempos de preparación, entrega y domicilios</p>
        </div>

        <button
          onClick={loadHistory}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Recargar
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}

      {history && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Registros en historial</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{history.summary.total_registros}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Entregados visibles</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{deliveredCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Domicilios de la semana</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{history.summary.total_domicilios_semana}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Promedio preparación</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatDuration(history.summary.tiempo_promedio_preparacion_segundos)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : !history || history.items.length === 0 ? (
        <div className="p-10 text-center rounded-xl border border-dashed border-gray-300 bg-white">
          <p className="text-gray-600">No hay registros cerrados en el historial.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {history.items.map((item) => (
            <article key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">Pedido #{item.id.slice(0, 8)}</p>
                  <h2 className="text-lg font-bold text-gray-900">{formatDestination(item)}</h2>
                  <p className="text-sm text-gray-600 mt-1">{typeLabel[item.tipo_pedido]}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs border bg-gray-100 text-gray-700">
                  {statusLabel[item.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <p>Total items: <span className="font-semibold text-gray-900">{item.total_items}</span></p>
                <p>Total: <span className="font-semibold text-gray-900">${Number(item.total_amount).toFixed(2)}</span></p>
                <p>Preparación: <span className="font-semibold text-gray-900">{formatDuration(item.tiempo_preparacion_segundos)}</span></p>
                <p>Tiempo total: <span className="font-semibold text-gray-900">{formatDuration(item.tiempo_total_segundos)}</span></p>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <p className="inline-flex items-center gap-1"><Clock3 size={14} /> Creado: {item.created_at ? new Date(item.created_at).toLocaleString() : 'Sin dato'}</p>
                <p>En cocina: {item.cocinando_at ? new Date(item.cocinando_at).toLocaleString() : 'Sin dato'}</p>
                <p>Listo: {item.served_at ? new Date(item.served_at).toLocaleString() : 'Sin dato'}</p>
                <p>Cierre: {item.entregado_at ? new Date(item.entregado_at).toLocaleString() : item.cancelado_at ? new Date(item.cancelado_at).toLocaleString() : 'Sin dato'}</p>
                {item.cliente_nombre ? <p>Cliente: {item.cliente_nombre} {item.cliente_telefono ? `• ${item.cliente_telefono}` : ''}</p> : null}
                {item.notas ? <p>Notas: {item.notas}</p> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
