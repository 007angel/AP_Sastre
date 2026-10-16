import React, { useEffect, useState } from 'react';
import { apiService, actions } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { Search, User, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const Clientes = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    fetchPedidos();
  }, []);

  useEffect(() => {
    processClientes();
  }, [pedidos, searchTerm]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await apiService.post({ action: actions.GET_PEDIDOS });
      if (response.success) {
        setPedidos(response.data || []);
      }
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const processClientes = () => {
    const clientMap = new Map();
    pedidos.forEach(p => {
      const nombre = p.Nombre_Completo;
      if (!nombre) return;
      if (!clientMap.has(nombre)) {
        clientMap.set(nombre, { nombre, pedidos: [], totalGastado: 0, saldoPendiente: 0 });
      }
      const c = clientMap.get(nombre);
      c.pedidos.push(p);
      if ((p.Estado || '').toLowerCase() !== 'anulado') {
        c.totalGastado += parseFloat(p.Monto_Total || 0);
        c.saldoPendiente += parseFloat(p.Saldo_Pendiente || 0);
      }
    });
    let list = Array.from(clientMap.values());
    if (searchTerm) {
      list = list.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setClientes(list);
  };

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    const sorted = [...cliente.pedidos].sort((a, b) => b.ID_Pedido - a.ID_Pedido);
    setHistorial(sorted);
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Clientes</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">Cargando...</div>
            ) : clientes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No hay clientes</div>
            ) : (
              clientes.map(c => (
                <div key={c.nombre} onClick={() => handleSelectCliente(c)} className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedCliente?.nombre === c.nombre ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center">
                    <User className="text-gray-400 mr-3" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{c.nombre}</p>
                      <p className="text-sm text-gray-500">{c.pedidos.length} pedido(s)</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Gastado: <span className="font-semibold">{formatCurrency(c.totalGastado)}</span></p>
                    <p>Saldo: <span className="font-semibold text-red-600">{formatCurrency(c.saldoPendiente)}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedCliente ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Historial de {selectedCliente.nombre}</h2>
              <div className="space-y-4">
                {historial.map(p => (
                  <div key={p.ID_Pedido} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">Pedido #{p.ID_Pedido}</p>
                        <p className="text-sm text-gray-500">Registro: {formatDate(p.Fecha_Registro)} | Entrega: {formatDate(p.Fecha_Entrega)}</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">{p.Estado}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-gray-600">Prenda</p><p>{p.Tipo_Prenda}</p></div>
                      <div><p className="text-gray-600">Monto</p><p>{formatCurrency(p.Monto_Total)}</p></div>
                      <div><p className="text-gray-600">Abono</p><p>{formatCurrency(p.Abono_Inicial)}</p></div>
                      <div><p className="text-gray-600">Saldo</p><p className="text-red-600">{formatCurrency(p.Saldo_Pendiente)}</p></div>
                    </div>
                    {p.Descripcion && <p className="text-sm text-gray-600 mt-2">{p.Descripcion}</p>}
                    {(p.Estado || '').toLowerCase() === 'anulado' && p.Motivo_Anulacion && <p className="text-sm text-red-600 mt-2">Motivo de anulación: {p.Motivo_Anulacion}</p>}
                    {p.URL_Fotografia && <img src={p.URL_Fotografia} alt="Foto" className="mt-2 w-32 h-32 object-cover rounded-lg" />}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <User size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Seleccione un cliente para ver su historial</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clientes;
