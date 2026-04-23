"use client";

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';

interface Discount {
  id: string;
  nombre: string;
  porcentaje: number;
  descripcion: string;
  activo: boolean;
  created_at: string;
}

export const DescuentosPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([
    {
      id: '1',
      nombre: 'Happy Hour',
      porcentaje: 15,
      descripcion: 'Descuento en bebidas de 17:00 a 19:00',
      activo: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      nombre: 'Fin de Semana',
      porcentaje: 10,
      descripcion: 'Descuento en viernes y sábado',
      activo: true,
      created_at: new Date().toISOString(),
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    porcentaje: '',
    descripcion: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newDiscount: Discount = {
      id: Date.now().toString(),
      nombre: formData.nombre,
      porcentaje: parseFloat(formData.porcentaje),
      descripcion: formData.descripcion,
      activo: true,
      created_at: new Date().toISOString(),
    };
    setDiscounts([...discounts, newDiscount]);
    setFormData({ nombre: '', porcentaje: '', descripcion: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este descuento?')) {
      setDiscounts(discounts.filter((d) => d.id !== id));
    }
  };

  const handleToggle = (id: string) => {
    setDiscounts(
      discounts.map((d) => (d.id === id ? { ...d, activo: !d.activo } : d))
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Descuentos</h1>
            <p className="text-gray-600 mt-2">Administra promociones y descuentos</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Nuevo Descuento
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Descuento</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre del descuento"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Porcentaje (%)"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.porcentaje}
                  onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <textarea
                placeholder="Descripción del descuento"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                rows={3}
              ></textarea>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de descuentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Tag size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No hay descuentos registrados</p>
            </div>
          ) : (
            discounts.map((discount) => (
              <div key={discount.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-900">{discount.nombre}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${discount.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {discount.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-primary-600">{discount.porcentaje}%</p>
                  <p className="text-gray-600 text-sm mt-2">{discount.descripcion}</p>
                </div>

                <div className="flex gap-2 border-t pt-4">
                  <button
                    onClick={() => handleToggle(discount.id)}
                    className={`flex-1 px-4 py-2 rounded-lg transition ${discount.activo ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {discount.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default DescuentosPage;
