import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { ProductosPage } from './pages/ProductosPage';
import { DescuentosPage } from './pages/DescuentosPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { PedidosPage } from './pages/mesero/PedidosPage';
import { NuevoPedidoPage } from './pages/mesero/NuevoPedidoPage';
import { PedidosCocinaPage } from './pages/cocina/PedidosCocinaPage';
import { authService } from './services/authService';
import './index.css';

const HomeRedirect: React.FC = () => {
  const user = authService.getCurrentUser();
  const role = String(user?.rol || '').toLowerCase();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'mesero') {
    return <Navigate to="/mesero/pedidos" replace />;
  }

  if (role === 'cocina') {
    return <Navigate to="/cocina/pedidos" replace />;
  }

  return <Navigate to="/admin" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute requiredRole="admin">
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <ProtectedRoute requiredRole="admin">
              <ProductosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/descuentos"
          element={
            <ProtectedRoute requiredRole="admin">
              <DescuentosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/configuracion"
          element={
            <ProtectedRoute requiredRole="admin">
              <ConfiguracionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cocina/pedidos"
          element={
            <ProtectedRoute requiredRole="cocina">
              <PedidosCocinaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mesero/pedidos"
          element={
            <ProtectedRoute requiredRole="mesero">
              <PedidosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mesero/pedidos/nuevo"
          element={
            <ProtectedRoute requiredRole="mesero">
              <NuevoPedidoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mesero/pedidos/:orderId/editar"
          element={
            <ProtectedRoute requiredRole="mesero">
              <NuevoPedidoPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
