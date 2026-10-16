import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import NuevoPedido from './pages/NuevoPedido';
import Pedidos from './pages/Pedidos';
import EditarPedido from './pages/EditarPedido';
import Clientes from './pages/Clientes';
import Reportes from './pages/Reportes';
import Login from './pages/Login';
import { getPin, clearPin } from './services/api';

function App() {
  const [authed, setAuthed] = useState(() => !!getPin());

  const handleLogout = () => {
    clearPin();
    setAuthed(false);
  };

  return (
    <Router>
      <div>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setAuthed(true)} />} />
          <Route path="/" element={authed ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard />} />
            <Route path="nuevo-pedido" element={<NuevoPedido />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="editar-pedido/:id" element={<EditarPedido />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>
          <Route path="*" element={<Navigate to={authed ? '/' : '/login'} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
