"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {  useRouter  } from 'next/navigation';
import Link from 'next/link';
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
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
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
    () =>
      history?.items.filter((item) => item.tipo_pedido === OrderType.DOMICILIO && item.status === OrderStatus.ENTREGADO).slice(0, 8) ||
      [],
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
            <h1 className="text-2xl font-bold text-gray-900">Domicilios</h1>
            <p className="text-sm text-gray-600 mt-1">Control semanal de salidas y seguimiento de entregas a domicilio</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Recargar
            </button>
            <button
              onClick={() => navigate('/mesero/pedidos/nuevo?tipo=domicilio')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus size={16} />
              Nuevo domicilio
            </button>
          </div>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Domicilios activos</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{activeDomicilios.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Domicilios visibles en historial semanal</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{history?.summary.total_domicilios_semana || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Historial reciente</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{recentDelivered.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Bike size={18} />
                <h2 className="font-semibold text-gray-900">Domicilios en curso</h2>
              </div>

              {activeDomicilios.length === 0 ? (
                <p className="text-sm text-gray-500">No hay domicilios activos.</p>
              ) : (
                <div className="space-y-3">
                  {activeDomicilios.map((order) => (
                    <article key={order.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
                          <h3 className="font-semibold text-gray-900">{order.cliente_nombre || 'Cliente sin nombre'}</h3>
                          <p className="text-sm text-gray-600">{statusLabel[order.status]}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/mesero/pedidos/${order.id}/editar`)}
                          className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                        >
                          Ver detalle
                        </button>
                      </div>
                      <p className="mt-3 text-sm text-gray-700 inline-flex items-center gap-2">
                        <MapPin size={14} />
                        {order.direccion_entrega || 'Sin dirección registrada'}
                      </p>
                      <p className="mt-2 text-sm text-gray-600">{order.cliente_telefono || 'Sin teléfono'}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <h2 className="font-semibold text-gray-900">Últimos domicilios entregados</h2>
              {recentDelivered.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no hay domicilios entregados en el historial visible.</p>
              ) : (
                <div className="space-y-3">
                  {recentDelivered.map((item) => (
                    <article key={item.id} className="rounded-xl border border-gray-200 p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{item.cliente_nombre || 'Cliente sin nombre'}</p>
                          <p className="text-gray-600">{item.direccion_entrega || 'Sin dirección'}</p>
                        </div>
                        <span className="text-gray-500">{item.entregado_at ? new Date(item.entregado_at).toLocaleDateString() : 'Sin fecha'}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-gray-600">
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

export default DomiciliosPage;
