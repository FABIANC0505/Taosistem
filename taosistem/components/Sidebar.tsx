"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  History,
  Users,
  UtensilsCrossed,
  Tag,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <BarChart3 size={20} /> },
  { label: 'Usuarios', href: '/admin/usuarios', icon: <Users size={20} /> },
  { label: 'Productos', href: '/admin/productos', icon: <UtensilsCrossed size={20} /> },
  { label: 'Descuentos', href: '/admin/descuentos', icon: <Tag size={20} /> },
  { label: 'Configuración', href: '/admin/configuracion', icon: <Settings size={20} /> },
  { label: 'Historial', href: '/admin/historial', icon: <History size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const pathname = usePathname() ?? '';
  const isActive = (href: string) => pathname === href;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 border-r border-slate-800/80 bg-slate-950/92 backdrop-blur-xl transform transition-transform duration-500 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ marginTop: '60px' }}
      >
        <div className="p-6 flex flex-col gap-6">
          <button
            onClick={onClose}
            className="icon-button lg:hidden absolute top-4 right-4"
          >
            <X size={20} />
          </button>

          <nav className="space-y-2 mt-8 lg:mt-0">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`nav-link px-4 py-3 transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
                  isActive(item.href)
                    ? 'nav-link-active border-l-4 border-l-emerald-400 font-semibold'
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
