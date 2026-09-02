import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-slate-800/80">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="icon-button lg:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight gradient-text">RestauTech</h1>
            <p className="hidden text-xs uppercase tracking-[0.2em] text-slate-500 sm:block">Control operativo</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 sm:block">
            {user?.rol}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 shadow-lg shadow-slate-950/30">
            <p className="font-medium text-slate-100">{user?.nombre}</p>
            <p className="text-xs capitalize text-slate-400">{user?.rol}</p>
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
