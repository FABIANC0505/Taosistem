"use client";

import React from 'react';
import { ChefHat, History } from 'lucide-react';
import { RoleShellLayout } from './RoleShellLayout';

interface CocinaLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Pedidos cocina', href: '/cocina/pedidos', icon: <ChefHat size={20} /> },
  { label: 'Historial', href: '/cocina/historial', icon: <History size={20} /> },
];

export const CocinaLayout: React.FC<CocinaLayoutProps> = ({ children }) => (
  <RoleShellLayout
    title="Panel Cocina"
    subtitle="Seguimiento de pedidos"
    brandClassName="bg-gradient-to-r from-orange-300 via-amber-300 to-emerald-300 bg-clip-text text-transparent"
    navItems={navItems}
  >
    {children}
  </RoleShellLayout>
);
