import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import NuevoPedido from './pages/NuevoPedido';
import Pedidos from './pages/Pedidos';
import EditarPedido from './pages/EditarPedido';
import Clientes from './pages/Clientes';
import Reportes from './pages/Reportes';

function App() {
  return (
    <Router>
      <div>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="nuevo-pedido" element={<NuevoPedido />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="editar-pedido/:id" element={<EditarPedido />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
