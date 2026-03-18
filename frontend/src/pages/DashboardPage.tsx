import React, { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Metrics } from '../types';
import { metricsService } from '../services/metricsService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface KPI {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await metricsService.getDashboard();
      setMetrics(data);
    } catch (err) {
      setError('Error al cargar el dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !metrics) {
    return (
      <AdminLayout>
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      </AdminLayout>
    );
  }

  if (!metrics) return null;

  const kpis: KPI[] = [
    {
      title: 'Ingresos Totales',
      value: `$${metrics.total_ingresos.toFixed(2)}`,
      change: 12,
      icon: <TrendingUp className="text-green-600" size={24} />,
    },
    {
      title: 'Total Órdenes',
      value: metrics.total_ordenes,
      change: 8,
      icon: <ShoppingCart className="text-blue-600" size={24} />,
    },
    {
      title: 'Órdenes Hoy',
      value: metrics.ordenes_hoy,
      change: 5,
      icon: <ShoppingCart className="text-indigo-600" size={24} />,
    },
    {
      title: 'Productos Agotados',
      value: metrics.productos_agotados,
      change: -3,
      icon: <AlertCircle className="text-orange-600" size={24} />,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Bienvenido al panel de administración</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">{kpi.icon}</div>
              </div>
              <p className={`text-sm mt-4 ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.change >= 0 ? '+' : ''}{kpi.change}% vs período anterior
              </p>
            </div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencia de Ingresos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Ingresos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.ingresos_por_dia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9' }}
                  name="Ingresos"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Media de Ingresos</p>
                <p className="text-xl font-bold text-blue-600">${metrics.media_ingresos.toFixed(2)}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Moda de Ingresos</p>
                <p className="text-xl font-bold text-indigo-600">${metrics.moda_ingresos.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Top Productos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Productos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.productos_top.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'ingresos') return `$${(value as number).toFixed(2)}`;
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="cantidad" fill="#0ea5e9" name="Cantidad Vendida" />
                <Bar dataKey="ingresos" fill="#8b5cf6" name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historial de Pedidos Despachados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos Despachados por Día</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={metrics.dispatched_por_dia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => `${value} pedidos`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                  name="Despachados"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos Despachados por Mes</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={metrics.dispatched_por_mes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => `${value} pedidos`} />
                <Legend />
                <Bar dataKey="cantidad" fill="#6366f1" name="Despachados" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Producto Más Vendido */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg shadow p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Producto Más Vendido</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100">Nombre</p>
              <h4 className="text-2xl font-bold">{metrics.producto_mas_vendido.nombre}</h4>
            </div>
            <div className="text-right">
              <p className="text-gray-100">Unidades Vendidas</p>
              <p className="text-3xl font-bold">{metrics.producto_mas_vendido.cantidad}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
