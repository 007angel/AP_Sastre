import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService, actions } from '../services/api';
import { formatCurrency, formatDate, buildWhatsAppUrl, buildReadyMessage } from '../utils/format';
import { Search, Eye, Edit, Ban, DollarSign, X, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const estadoColors = {
  'pendiente': 'bg-yellow-100 text-yellow-800',
  'en proceso': 'bg-orange-100 text-orange-800',
  'listo para entregar': 'bg-green-100 text-green-800',
  'entregado': 'bg-emerald-100 text-emerald-800',
  'anulado': 'bg-gray-200 text-gray-700',
};

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaFilter, setFechaFilter] = useState('');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [abonoData, setAbonoData] = useState({ monto: '', observaciones: '' });
  const [loadingAbono, setLoadingAbono] = useState(false);
  const [loadingAnular, setLoadingAnular] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPedidos();
  }, []);

  useEffect(() => {
    filterPedidos();
  }, [searchTerm, estadoFilter, fechaFilter, pedidos]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await apiService.post({
        action: actions.GET_PEDIDOS,
      });
      if (response.success) {
        setPedidos(response.data || []);
      }
    } catch (error) {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const filterPedidos = () => {
    let filtered = [...pedidos];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.ID_Pedido?.toString().toLowerCase().includes(term) ||
          p.Nombre_Completo?.toLowerCase().includes(term) ||
          p.Telefono?.toString().toLowerCase().includes(term)
      );
    }
    if (estadoFilter) {
      filtered = filtered.filter(
        (p) => (p.Estado || '').toLowerCase() === estadoFilter.toLowerCase()
      );
    }
    if (fechaFilter) {
      filtered = filtered.filter((p) => {
        if (!p.Fecha_Entrega) return false;
        const fecha = new Date(p.Fecha_Entrega).toISOString().split('T')[0];
        return fecha === fechaFilter;
      });
    }
    setFilteredPedidos(filtered);
    setCurrentPage(1);
  };

  const handleView = (pedido) => {
    setSelectedPedido(pedido);
    setShowModal(true);
  };

  const handleAbono = (pedido) => {
    setSelectedPedido(pedido);
    setAbonoData({ monto: '', observaciones: '' });
    setShowAbonoModal(true);
  };

  const handleAnular = (pedido) => {
    if ((pedido.Estado || '').toLowerCase() === 'anulado') {
      toast.error('El pedido ya está anulado');
      return;
    }
    setSelectedPedido(pedido);
    setMotivoAnulacion('');
    setShowAnularModal(true);
  };

  const submitAbono = async () => {
    const saldoActual = parseFloat(selectedPedido.Saldo_Pendiente || 0);
    if (saldoActual <= 0) {
      toast.error('El pedido no tiene saldo pendiente');
      return;
    }
    const monto = parseFloat(abonoData.monto);
    if (!monto || monto <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    if (monto > saldoActual && saldoActual >= 0) {
      if (monto > parseFloat(selectedPedido.Monto_Total || 0)) {
        toast.error('El abono no puede superar el monto total');
        return;
      }
    }
    try {
      setLoadingAbono(true);
      const response = await apiService.post({
        action: actions.ADD_ABONO,
        pedidoId: selectedPedido.ID_Pedido,
        montoAbono: monto,
        observaciones: abonoData.observaciones,
      });
      if (response.success) {
        toast.success(response.nuevoEstado ? 'Abono registrado. Pedido marcado como Entregado' : 'Abono registrado correctamente');
        setShowAbonoModal(false);
        fetchPedidos();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Error al registrar abono');
    } finally {
      setLoadingAbono(false);
    }
  };

  const confirmAnular = async () => {
    if (!motivoAnulacion.trim()) {
      toast.error('El motivo de anulación es obligatorio');
      return;
    }
    try {
      setLoadingAnular(true);
      const response = await apiService.post({
        action: actions.ANNUL_PEDIDO,
        pedidoId: selectedPedido.ID_Pedido,
        motivo: motivoAnulacion.trim(),
      });
      if (response.success) {
        toast.success('Pedido anulado correctamente');
        setShowAnularModal(false);
        fetchPedidos();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Error al anular pedido');
    } finally {
      setLoadingAnular(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPedidos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage);

  const isAtrasado = (pedido) => {
    const estadoLower = (pedido.Estado || '').toLowerCase();
    if (estadoLower === 'entregado' || estadoLower === 'anulado') return false;
    if (!pedido.Fecha_Entrega) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEntrega = new Date(pedido.Fecha_Entrega);
    fechaEntrega.setHours(23, 59, 59, 999);
    return fechaEntrega < hoy;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pedidos</h1>
        <Link
          to="/nuevo-pedido"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Nuevo Pedido
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o # pedido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Listo para entregar">Listo para entregar</option>
            <option value="Entregado">Entregado</option>
            <option value="Anulado">Anulado</option>
          </select>
          <input
            type="date"
            value={fechaFilter}
            onChange={(e) => setFechaFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setSearchTerm('');
              setEstadoFilter('');
              setFechaFilter('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : currentItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron pedidos</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prenda</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Entrega</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abono</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((pedido) => {
                    const estado = (pedido.Estado || '').toLowerCase();
                    const esAnulado = estado === 'anulado';
                    const atrasado = isAtrasado(pedido);
                    return (
                      <tr key={pedido.ID_Pedido} className={atrasado ? 'bg-red-50' : (esAnulado ? 'bg-gray-50' : '')}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.ID_Pedido}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{pedido.Nombre_Completo}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{pedido.Telefono || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{pedido.Tipo_Prenda}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(pedido.Fecha_Entrega)}
                          {atrasado && <span className="ml-2 text-xs text-red-600 font-semibold">(Atrasado)</span>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(pedido.Monto_Total)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(pedido.Abono_Inicial)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(pedido.Saldo_Pendiente)}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoColors[estado] || 'bg-gray-100 text-gray-800'}`}>
                            {pedido.Estado}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button onClick={() => handleView(pedido)} className="text-blue-600 hover:text-blue-900" title="Ver">
                              <Eye size={16} />
                            </button>
                            <Link to={`/editar-pedido/${pedido.ID_Pedido}`} className="text-indigo-600 hover:text-indigo-900" title="Editar">
                              <Edit size={16} />
                            </Link>
                            {!esAnulado && (
                              <button onClick={() => handleAbono(pedido)} className="text-green-600 hover:text-green-900" title="Agregar abono">
                                <DollarSign size={16} />
                              </button>
                            )}
                            {!esAnulado && (
                              <button onClick={() => handleAnular(pedido)} className="text-red-600 hover:text-red-900" title="Anular">
                                <Ban size={16} />
                              </button>
                            )}
                            {pedido.Telefono && (
                              <a
                                href={buildWhatsAppUrl(pedido.Telefono, buildReadyMessage(pedido))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-900"
                                title="Notificar por WhatsApp"
                              >
                                <MessageCircle size={16} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex space-x-2">
                  <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 border rounded ${currentPage === page ? 'bg-blue-600 text-white' : ''}`}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Detalle del Pedido #{selectedPedido.ID_Pedido}</h2>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Información General</h3>
                <div className="space-y-3">
                  <div><span className="text-gray-600">Cliente:</span> <span className="font-medium">{selectedPedido.Nombre_Completo}</span></div>
                  <div><span className="text-gray-600">Teléfono:</span> {selectedPedido.Telefono || 'N/A'}</div>
                  {selectedPedido.Telefono && (
                    <div>
                      <a
                        href={buildWhatsAppUrl(selectedPedido.Telefono, buildReadyMessage(selectedPedido))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <MessageCircle size={16} className="mr-2" />
                        Notificar por WhatsApp
                      </a>
                    </div>
                  )}
                  <div><span className="text-gray-600">Fecha Registro:</span> {formatDate(selectedPedido.Fecha_Registro)}</div>
                  <div><span className="text-gray-600">Fecha Entrega:</span> {formatDate(selectedPedido.Fecha_Entrega)}</div>
                  <div><span className="text-gray-600">Última Actualización:</span> {formatDate(selectedPedido.Ultima_Actualizacion)}</div>
                  <div><span className="text-gray-600">Tipo de Prenda:</span> {selectedPedido.Tipo_Prenda}</div>
                  <div><span className="text-gray-600">Estado:</span> {selectedPedido.Estado}</div>
                  <div className="md:col-span-2"><span className="text-gray-600">Descripción:</span> {selectedPedido.Descripcion || 'N/A'}</div>
                  {selectedPedido.items && selectedPedido.items.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Detalle de prendas:</span>
                      <ul className="mt-1 space-y-1">
                        {selectedPedido.items.map((it, idx) => (
                          <li key={idx} className="text-sm text-gray-800">
                            {it.Cantidad}x {it.Tipo_Prenda} — {formatCurrency(it.Precio_Unitario)} c/u = <span className="font-medium">{formatCurrency(it.Subtotal)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(selectedPedido.Estado || '').toLowerCase() === 'anulado' && (
                    <div className="md:col-span-2"><span className="text-gray-600">Motivo de anulación:</span> <span className="font-medium text-red-600">{selectedPedido.Motivo_Anulacion || 'N/A'}</span></div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Información Financiera</h3>
                <div className="space-y-3">
                  <div><span className="text-gray-600">Monto Total:</span> {formatCurrency(selectedPedido.Monto_Total)}</div>
                  <div><span className="text-gray-600">Abono Inicial:</span> {formatCurrency(selectedPedido.Abono_Inicial)}</div>
                  <div><span className="text-gray-600">Saldo Pendiente:</span> <span className="font-bold text-red-600">{formatCurrency(selectedPedido.Saldo_Pendiente)}</span></div>
                </div>
                {selectedPedido.URL_Fotografia && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-4">Fotografía</h3>
                    <img src={selectedPedido.URL_Fotografia} alt="Prenda" className="w-full rounded-lg border cursor-pointer" onClick={() => window.open(selectedPedido.URL_Fotografia, '_blank')} />
                    <p className="text-xs text-gray-500 mt-2">Click para ampliar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAbonoModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Agregar Abono - Pedido #{selectedPedido.ID_Pedido}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto del abono (GTQ)</label>
                <input type="number" step="0.01" min="0" value={abonoData.monto} onChange={(e) => setAbonoData({ ...abonoData, monto: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
                <p className="text-xs text-gray-500 mt-1">Saldo pendiente: {formatCurrency(selectedPedido.Saldo_Pendiente)}</p>
                <button
                  type="button"
                  onClick={() => setAbonoData({ ...abonoData, monto: parseFloat(selectedPedido.Saldo_Pendiente || 0).toFixed(2) })}
                  className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Cancelar saldo total ({formatCurrency(selectedPedido.Saldo_Pendiente)})
                </button>
                <p className="text-xs text-gray-500 mt-1">Al saldar el total, el pedido pasará automáticamente a Entregado.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea value={abonoData.observaciones} onChange={(e) => setAbonoData({ ...abonoData, observaciones: e.target.value })} rows="2" className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAbonoModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={submitAbono} disabled={loadingAbono} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{loadingAbono ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {showAnularModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Anular Pedido #{selectedPedido.ID_Pedido}</h2>
            <p>Se cambiará el estado del pedido de <span className="font-medium">{selectedPedido.Nombre_Completo}</span> a <span className="font-medium">Anulado</span>. El registro se conserva en el sistema.</p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de anulación *</label>
              <textarea value={motivoAnulacion} onChange={(e) => setMotivoAnulacion(e.target.value)} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Indique el motivo de la anulación" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAnularModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={confirmAnular} disabled={loadingAnular} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{loadingAnular ? 'Anulando...' : 'Anular pedido'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;
