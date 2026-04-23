"use client";

import React, { useEffect, useState } from 'react';
import { AlertCircle, ShoppingCart, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AdminLayout } from '../components/AdminLayout';
import { metricsService } from '../services/metricsService';
import { Metrics } from '../types';

interface KPI {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

const chartAxisStyle = {
  stroke: '#94a3b8',
  fontSize: 12,
};

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => {
      void loadMetrics();
    };

    refresh();
    const interval = setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
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
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-400" />
        </div>
      </AdminLayout>
    );
  }

  if (error && !metrics) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      </AdminLayout>
    );
  }

  if (!metrics) {
    return null;
  }

  const kpis: KPI[] = [
    {
      title: 'Ingresos Totales',
      value: `$${metrics.total_ingresos.toFixed(2)}`,
      change: 12,
      icon: <TrendingUp className="text-emerald-300" size={24} />,
    },
    {
      title: 'Total Ordenes',
      value: metrics.total_ordenes,
      change: 8,
      icon: <ShoppingCart className="text-cyan-300" size={24} />,
    },
    {
      title: 'Ordenes Hoy',
      value: metrics.ordenes_hoy,
      change: 5,
      icon: <ShoppingCart className="text-indigo-300" size={24} />,
    },
    {
      title: 'Productos Agotados',
      value: metrics.productos_agotados,
      change: -3,
      icon: <AlertCircle className="text-amber-300" size={24} />,
    },
    {
      title: 'Domicilios Semana',
      value: metrics.domicilios_semana,
      change: 0,
      icon: <ShoppingCart className="text-teal-300" size={24} />,
    },
    {
      title: 'Prep. Promedio',
      value: `${Math.round(metrics.tiempo_promedio_preparacion_segundos / 60)} min`,
      change: 0,
      icon: <TrendingUp className="text-sky-300" size={24} />,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        <div className="mb-8 animate-fade-in">
          <h1 className="gradient-text text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-2 font-medium text-slate-400">
            Bienvenido al panel de administracion
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
          {kpis.map((kpi, idx) => (
            <div
              key={kpi.title}
              className={`glass-card rounded-2xl border-t-4 p-6 animate-fade-in ${
                idx % 2 === 0 ? 'border-t-emerald-400' : 'border-t-cyan-400'
              }`}
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{kpi.title}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-100">{kpi.value}</p>
                </div>
                <div className="rounded-lg bg-slate-950/55 p-3">{kpi.icon}</div>
              </div>
              <p className={`mt-4 text-sm ${kpi.change >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {kpi.change >= 0 ? '+' : ''}
                {kpi.change}% vs periodo anterior
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            className="glass-card rounded-2xl p-6 animate-slide-up"
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Tendencia de Ingresos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.ingresos_por_dia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="fecha" tick={chartAxisStyle} axisLine={{ stroke: '#334155' }} />
                <YAxis tick={chartAxisStyle} axisLine={{ stroke: '#334155' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1e293b',
                    color: '#e2e8f0',
                    borderRadius: 12,
                  }}
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ fill: '#38bdf8' }}
                  name="Ingresos"
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/10 p-4">
                <p className="text-sm text-slate-300">Media de Ingresos</p>
                <p className="text-xl font-bold text-cyan-200">
                  ${metrics.media_ingresos.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/10 p-4">
                <p className="text-sm text-slate-300">Moda de Ingresos</p>
                <p className="text-xl font-bold text-indigo-200">
                  ${metrics.moda_ingresos.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div
            className="glass-card rounded-2xl p-6 animate-slide-up"
            style={{ animationDelay: '400ms', animationFillMode: 'both' }}
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Top Productos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.productos_top.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="nombre"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={chartAxisStyle}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis tick={chartAxisStyle} axisLine={{ stroke: '#334155' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1e293b',
                    color: '#e2e8f0',
                    borderRadius: 12,
                  }}
                  formatter={(value, name) => {
                    if (name === 'ingresos') {
                      return `$${(value as number).toFixed(2)}`;
                    }
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="cantidad" fill="#22c55e" name="Cantidad Vendida" />
                <Bar dataKey="ingresos" fill="#38bdf8" name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            className="glass-card rounded-2xl p-6 animate-slide-up"
            style={{ animationDelay: '500ms', animationFillMode: 'both' }}
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Pedidos Despachados por Dia</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={metrics.dispatched_por_dia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="fecha" tick={chartAxisStyle} axisLine={{ stroke: '#334155' }} />
                <YAxis
                  allowDecimals={false}
                  tick={chartAxisStyle}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1e293b',
                    color: '#e2e8f0',
                    borderRadius: 12,
                  }}
                  formatter={(value) => `${value} pedidos`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ fill: '#34d399' }}
                  name="Despachados"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div
            className="glass-card rounded-2xl p-6 animate-slide-up"
            style={{ animationDelay: '600ms', animationFillMode: 'both' }}
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Pedidos Despachados por Mes</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={metrics.dispatched_por_mes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mes" tick={chartAxisStyle} axisLine={{ stroke: '#334155' }} />
                <YAxis
                  allowDecimals={false}
                  tick={chartAxisStyle}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1e293b',
                    color: '#e2e8f0',
                    borderRadius: 12,
                  }}
                  formatter={(value) => `${value} pedidos`}
                />
                <Legend />
                <Bar dataKey="cantidad" fill="#818cf8" name="Despachados" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-sky-500 p-8 text-slate-950 shadow-xl shadow-cyan-950/20 transition-transform duration-300 hover:scale-[1.02] animate-slide-up"
            style={{ animationDelay: '700ms', animationFillMode: 'both' }}
          >
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
            <h3 className="relative z-10 mb-4 text-lg font-semibold text-slate-950/80">
              Producto Mas Vendido
            </h3>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-950/70">Nombre</p>
                <h4 className="text-2xl font-bold">{metrics.producto_mas_vendido.nombre}</h4>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-950/70">Unidades Vendidas</p>
                <p className="text-3xl font-bold">{metrics.producto_mas_vendido.cantidad}</p>
              </div>
            </div>
          </div>

          <div
            className="glass-card rounded-2xl p-8 animate-slide-up"
            style={{ animationDelay: '800ms', animationFillMode: 'both' }}
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Tiempos operativos</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Preparacion promedio</p>
                <p className="text-2xl font-bold text-slate-100">
                  {Math.round(metrics.tiempo_promedio_preparacion_segundos / 60)} min
                </p>
              </div>
              <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/10 p-4">
                <p className="text-sm text-slate-300">Tiempo total promedio</p>
                <p className="text-2xl font-bold text-emerald-200">
                  {Math.round(metrics.tiempo_promedio_entrega_segundos / 60)} min
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
