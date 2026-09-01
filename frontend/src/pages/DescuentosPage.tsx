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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Gestión de Descuentos</h1>
            <p className="mt-2 text-slate-300">Administra promociones y descuentos</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            <Plus size={20} />
            Nuevo Descuento
          </button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Crear Nuevo Descuento</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nombre del descuento"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="field-input"
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
                  className="field-input"
                />
              </div>
              <textarea
                placeholder="Descripción del descuento"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="field-input w-full"
                rows={3}
              ></textarea>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {discounts.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <Tag size={48} className="mx-auto mb-4 text-slate-400" />
              <p className="text-slate-300">No hay descuentos registrados</p>
            </div>
          ) : (
            discounts.map((discount) => (
              <div key={discount.id} className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-100">{discount.nombre}</h3>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${discount.activo ? 'bg-emerald-500/10 text-emerald-200' : 'bg-slate-700 text-slate-200'}`}>
                    {discount.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-emerald-300">{discount.porcentaje}%</p>
                  <p className="mt-2 text-sm text-slate-300">{discount.descripcion}</p>
                </div>

                <div className="flex gap-2 border-t border-slate-700 pt-4">
                  <button
                    onClick={() => handleToggle(discount.id)}
                    className={`flex-1 rounded-lg px-4 py-2 transition ${discount.activo ? 'bg-orange-500/10 text-orange-200 hover:bg-orange-500/20' : 'bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'}`}
                  >
                    {discount.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id)}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-red-200 transition hover:bg-red-500/10"
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
