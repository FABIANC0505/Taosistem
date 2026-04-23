"use client";

import React from 'react';
import { BellRing, CreditCard } from 'lucide-react';
import { RoleShellLayout } from './RoleShellLayout';

interface CajeroLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Caja y mesas', href: '/cajero', icon: <CreditCard size={20} /> },
  { label: 'Avisos', href: '/cajero#avisos', icon: <BellRing size={20} /> },
];

export const CajeroLayout: React.FC<CajeroLayoutProps> = ({ children }) => (
  <RoleShellLayout
    title="Panel Caja"
    subtitle="Arqueo ciego y mesas"
    brandClassName="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent"
    navItems={navItems}
  >
    {children}
  </RoleShellLayout>
);
