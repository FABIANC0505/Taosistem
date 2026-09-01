import React, { useEffect, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { settingsService } from '../services/settingsService';

export const ConfiguracionPage: React.FC = () => {
  const [settings, setSettings] = useState({
    nombreRestaurante: 'RestauTech',
    horarioApertura: '09:00',
    horarioCierre: '23:00',
    telefonoContacto: '+34 912 345 678',
    emailContacto: 'info@restaurante.com',
    direccion: 'Calle Principal 123, Madrid',
    impuestos: '21',
    moneda: 'EUR',
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [retentionDays, setRetentionDays] = useState(90);

  useEffect(() => {
    loadHistoryRetention();
  }, []);

  const loadHistoryRetention = async () => {
    try {
      const data = await settingsService.getHistoryRetention();
      setRetentionDays(data.retention_days);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la configuración de historial');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSave = async () => {
    try {
      setError('');
      await settingsService.updateHistoryRetention(retentionDays);
      setSuccess('Configuración guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la configuración');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Configuración del Restaurante</h1>
          <p className="mt-2 text-slate-300">Administra la configuración general de tu establecimiento</p>
        </div>

        {success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Settings size={20} />
            Información General
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Nombre del Restaurante
                </label>
                <input
                  type="text"
                  name="nombreRestaurante"
                  value={settings.nombreRestaurante}
                  onChange={handleChange}
                  className="field-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  name="emailContacto"
                  value={settings.emailContacto}
                  onChange={handleChange}
                  className="field-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  name="telefonoContacto"
                  value={settings.telefonoContacto}
                  onChange={handleChange}
                  className="field-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={settings.direccion}
                  onChange={handleChange}
                  className="field-input w-full"
                />
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h4 className="mb-4 text-md font-semibold text-slate-100">Horarios de Operación</h4>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Hora de Apertura
                  </label>
                  <input
                    type="time"
                    name="horarioApertura"
                    value={settings.horarioApertura}
                    onChange={handleChange}
                    className="field-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Hora de Cierre
                  </label>
                  <input
                    type="time"
                    name="horarioCierre"
                    value={settings.horarioCierre}
                    onChange={handleChange}
                    className="field-input w-full"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h4 className="mb-4 text-md font-semibold text-slate-100">Impuestos y Moneda</h4>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Porcentaje de Impuestos (%)
                  </label>
                  <input
                    type="number"
                    name="impuestos"
                    value={settings.impuestos}
                    onChange={handleChange}
                    step="0.01"
                    className="field-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Moneda
                  </label>
                  <select
                    name="moneda"
                    value={settings.moneda}
                    onChange={handleChange}
                    className="field-input w-full"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="MXN">MXN ($)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h4 className="mb-4 text-md font-semibold text-slate-100">Historial de Pedidos</h4>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Retención de historial (días)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value || 1))}
                    className="field-input w-full"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Los pedidos despachados más antiguos que este límite se eliminarán automáticamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-700 pt-6">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2 font-medium text-slate-950 transition hover:bg-emerald-400"
              >
                <Save size={20} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
