"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {  useRouter  } from 'next/navigation';
import Link from 'next/link';
import { Plus, RefreshCw, SquarePen, CircleX, CheckCheck, Bike } from 'lucide-react';
import { MeseroLayout } from '../../components/MeseroLayout';
import { Order, OrderStatus, OrderType, WaiterAlert } from '../../types';
import { ordersService } from '../../services/orders';
import { cashierService } from '../../services/cashierService';

const statusStyles: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'bg-amber-100 text-amber-800 border-amber-200',
  [OrderStatus.EN_PREPARACION]: 'bg-blue-100 text-blue-800 border-blue-200',
  [OrderStatus.LISTO]: 'bg-green-100 text-green-800 border-green-200',
  [OrderStatus.ENTREGADO]: 'bg-gray-100 text-gray-700 border-gray-200',
  [OrderStatus.CANCELADO]: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'Pendiente',
  [OrderStatus.EN_PREPARACION]: 'En preparación',
  [OrderStatus.LISTO]: 'Listo para entregar',
  [OrderStatus.ENTREGADO]: 'Entregado',
  [OrderStatus.CANCELADO]: 'Cancelado',
};

export const PedidosPage: React.FC = () => {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
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
            <h1 className="text-2xl font-bold text-gray-900">Pedidos en curso</h1>
            <p className="text-sm text-gray-600 mt-1">Mesero crea, cocina prepara y aquí confirmas la entrega final al cliente</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadOrders}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Recargar
            </button>
            <button
              onClick={() => navigate('/mesero/domicilios')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100"
            >
              <Bike size={16} />
              Ver domicilios
            </button>
            <button
              onClick={() => navigate('/mesero/pedidos/nuevo')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus size={16} />
              Nuevo pedido
            </button>
          </div>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}

        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Aviso de caja para mesa {alert.mesa_numero}</p>
                    <p className="text-sm text-amber-800 mt-1">{alert.message}</p>
                  </div>
                  <button
                    onClick={() => void resolveAlert(alert.id)}
                    className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
                  >
                    Marcar atendido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="p-10 text-center rounded-xl border border-dashed border-gray-300 bg-white">
            <p className="text-gray-600">No hay pedidos activos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
              <article key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
                    <h2 className="text-xl font-bold text-gray-900">
                      {order.tipo_pedido === OrderType.DOMICILIO ? order.cliente_nombre || 'Domicilio' : `Mesa ${order.mesa_numero}`}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.tipo_pedido === OrderType.DOMICILIO ? order.direccion_entrega : 'Servicio en mesa'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full border font-medium ${statusStyles[order.status]}`}>
                    {statusLabel[order.status]}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-700">
                  <p>{order.items.reduce((acc, item) => acc + item.cantidad, 0)} productos</p>
                  <p className="font-semibold text-primary-700">Total: ${Number(order.total_amount).toFixed(2)}</p>
                  {order.notas ? <p className="text-xs text-gray-500">Nota: {order.notas}</p> : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/mesero/pedidos/${order.id}/editar`)}
                    disabled={order.status !== OrderStatus.PENDIENTE}
                    className="inline-flex justify-center items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    <SquarePen size={16} />
                    Editar
                  </button>

                  <button
                    onClick={() => cancelOrder(order)}
                    disabled={actionLoading === order.id || order.status === OrderStatus.ENTREGADO}
                    className="inline-flex justify-center items-center gap-2 rounded-lg border border-red-200 text-red-700 px-3 py-2 text-sm hover:bg-red-50 disabled:opacity-60"
                  >
                    <CircleX size={16} />
                    Cancelar
                  </button>
                </div>

                <button
                  onClick={() => confirmDelivery(order)}
                  disabled={actionLoading === order.id || order.status !== OrderStatus.LISTO}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
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

export default PedidosPage;
