"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface RoleShellNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface RoleShellLayoutProps {
  title: string;
  subtitle: string;
  brandClassName: string;
  navItems: RoleShellNavItem[];
  children: React.ReactNode;
}

export const RoleShellLayout: React.FC<RoleShellLayoutProps> = ({
  title,
  subtitle,
  brandClassName,
  navItems,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell flex min-h-screen">
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menu"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-slate-800/80 bg-slate-950/92 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-5">
          <div>
            <p className={`text-lg font-extrabold tracking-tight ${brandClassName}`}>{title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">Operacion</p>
          </div>
          <button className="icon-button lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800/80 px-4 py-4">
          <div className="panel-muted flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-semibold text-slate-100">{user?.nombre || title}</p>
              <p className="text-xs capitalize text-slate-400">{subtitle}</p>
            </div>
            <button
              onClick={handleLogout}
              className="danger-icon-button"
              title="Cerrar sesion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-800/70 bg-slate-950/55 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="icon-button lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <div>
                <p className="text-lg font-bold text-slate-100">{user?.nombre || title}</p>
                <p className="text-sm text-slate-400">{subtitle}</p>
              </div>
            </div>
            <div className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 sm:block">
              {title}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
};
