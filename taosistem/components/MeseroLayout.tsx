"use client";

import React from 'react';
import { Bike, ClipboardList, PlusSquare } from 'lucide-react';
import { RoleShellLayout } from './RoleShellLayout';

interface MeseroLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Pedidos', href: '/mesero/pedidos', icon: <ClipboardList size={20} /> },
  { label: 'Nuevo pedido', href: '/mesero/pedidos/nuevo', icon: <PlusSquare size={20} /> },
  { label: 'Domicilios', href: '/mesero/domicilios', icon: <Bike size={20} /> },
];

export const MeseroLayout: React.FC<MeseroLayoutProps> = ({ children }) => (
  <RoleShellLayout
    title="Panel Mesero"
    subtitle="Gestion de pedidos y atencion"
    brandClassName="gradient-text"
    navItems={navItems}
  >
    {children}
  </RoleShellLayout>
);
