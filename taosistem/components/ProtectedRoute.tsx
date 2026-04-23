"use client";

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const currentRole = String(user?.rol || '').toLowerCase();
  const normalizedRequiredRole = String(requiredRole || '').toLowerCase();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (requiredRole && currentRole !== normalizedRequiredRole) {
      if (currentRole === 'mesero') {
        router.replace('/mesero/pedidos');
        return;
      }
      if (currentRole === 'cocina') {
        router.replace('/cocina/pedidos');
        return;
      }
      if (currentRole === 'cajero') {
        router.replace('/cajero');
        return;
      }
      router.replace('/admin');
    }
  }, [currentRole, loading, normalizedRequiredRole, requiredRole, router, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || (requiredRole && currentRole !== normalizedRequiredRole)) {
    return null;
  }

  return <>{children}</>;
};
