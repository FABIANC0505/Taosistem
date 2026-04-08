import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { authService } from '../services/authService';
import { isApiBaseUrlConfigured } from '../utils/runtimeConfig';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const missingProductionApiConfig = import.meta.env.PROD && !isApiBaseUrlConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      authService.logout();

      const response = await authService.login({
        email: email.trim(),
        password,
      });

      authService.saveAuth(response.access_token, response.user);

      const role = String(response.user?.rol || '').toLowerCase();

      if (role === 'mesero') {
        navigate('/mesero/pedidos');
      } else if (role === 'cocina') {
        navigate('/cocina/pedidos');
      } else if (role === 'cajero') {
        navigate('/cajero');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Error al iniciar sesion';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="panel-surface relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_30%)]" />

          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">RestauTech</p>
            <h1 className="mt-4 max-w-md text-5xl font-extrabold leading-tight text-slate-50">
              Operacion clara, servicio rapido y control total.
            </h1>
            <p className="mt-4 max-w-lg text-base text-slate-300">
              Accede al panel segun tu rol y monitorea pedidos, cocina, caja e historial desde una interfaz mas limpia y enfocada.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            {[
              ['Mesero', 'Pedidos y domicilios'],
              ['Cocina', 'Tiempos y entregas'],
              ['Caja', 'Arqueo y mesas'],
            ].map(([title, text]) => (
              <div key={title} className="panel-muted p-4">
                <p className="text-sm font-bold text-slate-100">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="panel-surface w-full max-w-md justify-self-center p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Acceso seguro
            </div>
            <h1 className="gradient-text text-3xl font-bold">RestauTech</h1>
            <p className="mt-2 text-slate-400">Ingresa con tu correo y contrasena</p>
          </div>

          {missingProductionApiConfig && (
            <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Falta configurar <code>VITE_API_URL</code> para produccion. El frontend necesita la URL publica del backend para iniciar sesion y cargar imagenes.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="field-input pl-10 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="admin@restaurante.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="field-input pl-10 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Tu contrasena"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="primary-button w-full">
              {loading ? 'Iniciando sesion...' : 'Iniciar sesion'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Contacta al administrador si olvidaste tu contrasena
          </p>
        </div>
      </div>
    </div>
  );
};
