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
    {
      title: 'Domicilios Semana',
      value: metrics.domicilios_semana,
      change: 0,
      icon: <ShoppingCart className="text-emerald-600" size={24} />,
    },
    {
      title: 'Prep. Promedio',
      value: `${Math.round(metrics.tiempo_promedio_preparacion_segundos / 60)} min`,
      change: 0,
      icon: <TrendingUp className="text-cyan-600" size={24} />,
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

        <div className="animate-fade-in mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-2 font-medium">Bienvenido al panel de administración</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
          {kpis.map((kpi, idx) => (
            <div 
              key={idx} 
              className={`glass-card rounded-2xl p-6 border-t-4 animate-fade-in ${
                idx % 2 === 0 ? 'border-t-primary-500' : 'border-t-secondary-500'
              }`}
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
            >
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Ingresos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.ingresos_por_dia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9' }} name="Ingresos" />
              </LineChart>
            </ResponsiveContainer>

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

          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos Despachados por Día</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={metrics.dispatched_por_dia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => `${value} pedidos`} />
                <Legend />
                <Line type="monotone" dataKey="cantidad" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Despachados" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-primary-600 via-secondary-600 to-purple-700 rounded-2xl shadow-xl shadow-primary-500/20 p-8 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 animate-slide-up" style={{ animationDelay: '700ms', animationFillMode: 'both' }}>
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-lg font-semibold mb-4 text-primary-100 relative z-10">Producto Más Vendido</h3>
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

          <div className="glass-card rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempos operativos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Preparación promedio</p>
                <p className="text-2xl font-bold text-slate-900">{Math.round(metrics.tiempo_promedio_preparacion_segundos / 60)} min</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Tiempo total promedio</p>
                <p className="text-2xl font-bold text-emerald-700">{Math.round(metrics.tiempo_promedio_entrega_segundos / 60)} min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
