import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 border-r border-slate-800/80 bg-slate-950/92 backdrop-blur-xl transition-transform duration-500 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ marginTop: '60px' }}
      >
        <div className="flex flex-col gap-6 p-6">
          <button
            onClick={onClose}
            className="icon-button absolute right-4 top-4 lg:hidden"
          >
            <X size={20} />
          </button>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950/80 p-3 lg:mt-0">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Administracion</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">Panel central</p>
          </div>

          <nav className="mt-2 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
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
