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
    <nav className="glass sticky top-0 z-50">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-2xl font-extrabold gradient-text tracking-tight">RestauTech</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            <p className="font-medium">{user?.nombre}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};
