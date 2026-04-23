"use client";

import React, { useEffect, useState } from 'react';
import { Edit2, Package, Plus, Trash2 } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { productService } from '../services/productService';
import { Product } from '../types';
import { resolveMediaUrl } from '../utils/media';

export const ProductosPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    categoria: '',
    imagen: null as File | null,
  });

  useEffect(() => {
    void loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', precio: '', descripcion: '', categoria: '', imagen: null });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('nombre', formData.nombre);
      form.append('precio', formData.precio);
      form.append('descripcion', formData.descripcion);
      form.append('categoria', formData.categoria);

      if (formData.imagen) {
        form.append('imagen', formData.imagen);
      }

      if (editingProduct) {
        await productService.update(editingProduct.id, form);
      } else {
        await productService.create(form);
      }

      resetForm();
      await loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar producto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      precio: product.precio.toString(),
      descripcion: product.descripcion || '',
      categoria: product.categoria,
      imagen: null,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Estas seguro de que deseas eliminar este producto?')) {
      try {
        await productService.delete(id);
        await loadProducts();
      } catch {
        setError('Error al eliminar producto');
      }
    }
  };

  const handleMarkOutOfStock = async (id: string) => {
    try {
      await productService.markAsOutOfStock(id);
      await loadProducts();
    } catch {
      setError('Error al marcar como agotado');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Gestion de Productos</h1>
            <p className="mt-2 text-slate-400">
              Administra el menu del restaurante con imagenes, disponibilidad y categorias.
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm && editingProduct) {
                resetForm();
              } else {
                setShowForm(!showForm);
              }
            }}
            className="primary-button flex items-center gap-2"
          >
            <Plus size={20} />
            {showForm ? 'Cerrar formulario' : 'Nuevo producto'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {showForm && (
          <div className="panel-surface p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">
              {editingProduct ? 'Editar producto' : 'Crear nuevo producto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="field-input"
                />
                <input
                  type="number"
                  placeholder="Precio"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  required
                  className="field-input"
                />
                <input
                  type="text"
                  placeholder="Categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  required
                  className="field-input"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, imagen: e.target.files?.[0] || null })}
                  className="field-input file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-200"
                />
              </div>
              <textarea
                placeholder="Descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="field-input"
                rows={3}
              />
              <div className="flex gap-2">
                <button type="submit" className="primary-button">
                  {editingProduct ? 'Guardar cambios' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-slate-200 transition hover:bg-slate-800"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center p-8">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <Package size={48} className="mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400">No hay productos registrados</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="glass-card overflow-hidden rounded-2xl">
                {product.imagen_url && (
                  <img
                    src={resolveMediaUrl(product.imagen_url)}
                    alt={product.nombre}
                    className="h-48 w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-100">{product.nombre}</h3>
                  <p className="mt-1 text-sm text-slate-400">{product.descripcion}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-bold text-emerald-300">
                      ${product.precio.toFixed(2)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        product.disponible
                          ? 'bg-emerald-500/15 text-emerald-200'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {product.disponible ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Categoria: {product.categoria}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-200 transition hover:bg-cyan-500/20"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-200 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                  {product.disponible && (
                    <button
                      onClick={() => handleMarkOutOfStock(product.id)}
                      className="mt-2 w-full rounded-xl bg-amber-500/15 p-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/25"
                    >
                      Marcar como agotado
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductosPage;
