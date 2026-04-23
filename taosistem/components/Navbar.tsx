"use client";

import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {  useRouter  } from 'next/navigation';
import Link from 'next/link';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="icon-button lg:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div>
            <h1 className="text-2xl font-extrabold gradient-text tracking-tight">RestauTech</h1>
            <p className="hidden text-xs uppercase tracking-[0.2em] text-slate-500 sm:block">Control operativo</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 sm:block">
            {user?.rol}
          </div>
          <div className="text-sm text-slate-200">
            <p className="font-medium">{user?.nombre}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.rol}</p>
          </div>

          <button
            onClick={handleLogout}
            className="danger-icon-button"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};
