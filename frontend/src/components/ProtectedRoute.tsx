import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const currentRole = String(user?.rol || '').toLowerCase();
  const normalizedRequiredRole = String(requiredRole || '').toLowerCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentRole !== normalizedRequiredRole) {
    if (currentRole === 'mesero') {
      return <Navigate to="/mesero/pedidos" replace />;
    }
    if (currentRole === 'cocina') {
      return <Navigate to="/cocina/pedidos" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
