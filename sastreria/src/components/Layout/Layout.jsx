import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Home, FilePlus, List, Users, BarChart3 } from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/nuevo-pedido', icon: FilePlus, label: 'Nuevo pedido' },
    { path: '/pedidos', icon: List, label: 'Pedidos' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') {
      return false;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">Sastrería</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={24} />
          </button>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  isActive(item.path) ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 lg:ml-64">
        <div className="bg-white shadow-sm h-16 flex items-center px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h2 className="ml-4 text-lg font-semibold">Sastrería</h2>
        </div>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
