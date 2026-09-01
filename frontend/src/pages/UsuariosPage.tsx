import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Shield, Lock } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { User, UserRole } from '../types';
import { userService } from '../services/userService';
import { getErrorMessage } from '../utils/errorUtils';

export const UsuariosPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: UserRole.MESERO,
  });

  useEffect(() => {
    const refresh = () => {
      void loadUsers();
    };

    refresh();
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userService.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al cargar usuarios'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanNombre = formData.nombre.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    if (cleanNombre.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (cleanPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await userService.create({
        nombre: cleanNombre,
        email: cleanEmail,
        password: cleanPassword,
        rol: formData.rol,
      });
      setFormData({ nombre: '', email: '', password: '', rol: UserRole.MESERO });
      setShowForm(false);
      await loadUsers();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al crear usuario'));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await userService.delete(id);
        await loadUsers();
      } catch (err: any) {
        setError(getErrorMessage(err, 'Error al eliminar usuario'));
      }
    }
  };

  const handleUpdateRole = async (id: string, newRole: UserRole) => {
    try {
      await userService.updateRole(id, newRole);
      await loadUsers();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al actualizar rol'));
    }
  };

  const handleToggleActivo = async (user: User) => {
    try {
      if (user.activo) {
        await userService.deactivate(user.id);
      } else {
        await userService.update(user.id, { activo: true });
      }
      await loadUsers();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al actualizar estado del usuario'));
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'border-red-500/40 bg-red-500/10 text-red-200';
      case UserRole.COCINA:
        return 'border-orange-500/40 bg-orange-500/10 text-orange-200';
      case UserRole.MESERO:
        return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200';
      case UserRole.CAJERO:
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
      default:
        return 'border-slate-600 bg-slate-800 text-slate-200';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Gestión de Usuarios</h1>
            <p className="mt-2 text-slate-300">Administra los usuarios del restaurante</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            <Plus size={20} />
            Nuevo Usuario
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {showForm && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    minLength={2}
                    className="field-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Correo electrónico</label>
                  <input
                    type="email"
                    placeholder="usuario@restaurante.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="field-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Contraseña <span className="font-normal text-slate-400">(Mínimo 8 caracteres)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    className="field-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Rol</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as UserRole })}
                    className="field-input w-full"
                  >
                    <option value={UserRole.MESERO}>Mesero</option>
                    <option value={UserRole.COCINA}>Cocina</option>
                    <option value={UserRole.CAJERO}>Cajero</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
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

        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-xl shadow-slate-950/30">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-400"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-700 bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Rol</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                        No hay usuarios para mostrar.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="transition hover:bg-slate-800/60">
                        <td className="px-6 py-4 text-sm font-medium text-slate-100">{user.nombre}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <select
                            value={user.rol}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                            className={`cursor-pointer rounded-lg border px-3 py-1 text-sm font-semibold ${getRoleColor(user.rol)}`}
                          >
                            <option value={UserRole.MESERO}>Mesero</option>
                            <option value={UserRole.COCINA}>Cocina</option>
                            <option value={UserRole.CAJERO}>Cajero</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`rounded-lg px-3 py-1 text-sm font-medium ${user.activo ? 'bg-emerald-500/10 text-emerald-200' : 'bg-slate-700 text-slate-200'}`}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActivo(user)}
                              className={`rounded-lg p-2 transition ${user.activo ? 'text-slate-300 hover:bg-slate-700' : 'text-emerald-200 hover:bg-emerald-500/10'}`}
                              title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                            >
                              {user.activo ? <Lock size={16} /> : <Shield size={16} />}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="rounded-lg p-2 text-red-300 transition hover:bg-red-500/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
