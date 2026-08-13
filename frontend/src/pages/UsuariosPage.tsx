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
        return 'bg-red-100 text-red-900 border-red-300';
      case UserRole.COCINA:
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case UserRole.MESERO:
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case UserRole.CAJERO:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-2">Administra los usuarios del restaurante</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Nuevo Usuario
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    minLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:text-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    placeholder="usuario@restaurante.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:text-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contraseña <span className="text-gray-500 font-normal">(Mínimo 8 caracteres)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:text-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rol</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as UserRole })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:text-gray-900 outline-none"
                  >
                    <option className="bg-white text-gray-900" value={UserRole.MESERO}>Mesero</option>
                    <option className="bg-white text-gray-900" value={UserRole.COCINA}>Cocina</option>
                    <option className="bg-white text-gray-900" value={UserRole.CAJERO}>Cajero</option>
                    <option className="bg-white text-gray-900" value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition font-medium"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Rol</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                        No hay usuarios para mostrar.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.nombre}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <select
                            value={user.rol}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold border cursor-pointer ${getRoleColor(user.rol)}`}
                          >
                            <option className="bg-white text-gray-900" value={UserRole.MESERO}>Mesero</option>
                            <option className="bg-white text-gray-900" value={UserRole.COCINA}>Cocina</option>
                            <option className="bg-white text-gray-900" value={UserRole.CAJERO}>Cajero</option>
                            <option className="bg-white text-gray-900" value={UserRole.ADMIN}>Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${user.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActivo(user)}
                              className={`p-2 rounded-lg transition ${user.activo ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-green-50 text-green-600'}`}
                              title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                            >
                              {user.activo ? <Lock size={16} /> : <Shield size={16} />}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
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
