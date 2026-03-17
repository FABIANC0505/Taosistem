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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Restaurante</h1>
          <p className="text-gray-600 mt-2">Administra la configuración general de tu establecimiento</p>
        </div>

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Configuración General */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Settings size={20} />
            Información General
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Restaurante
                </label>
                <input
                  type="text"
                  name="nombreRestaurante"
                  value={settings.nombreRestaurante}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  name="emailContacto"
                  value={settings.emailContacto}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  name="telefonoContacto"
                  value={settings.telefonoContacto}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={settings.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Horarios */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold mb-4">Horarios de Operación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Apertura
                  </label>
                  <input
                    type="time"
                    name="horarioApertura"
                    value={settings.horarioApertura}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Cierre
                  </label>
                  <input
                    type="time"
                    name="horarioCierre"
                    value={settings.horarioCierre}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Impuestos y Moneda */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold mb-4">Impuestos y Moneda</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porcentaje de Impuestos (%)
                  </label>
                  <input
                    type="number"
                    name="impuestos"
                    value={settings.impuestos}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda
                  </label>
                  <select
                    name="moneda"
                    value={settings.moneda}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="MXN">MXN ($)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold mb-4">Historial de Pedidos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retención de historial (días)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value || 1))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Los pedidos despachados más antiguos que este límite se eliminarán automáticamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition"
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
