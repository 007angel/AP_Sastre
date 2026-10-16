import React, { useEffect, useState } from 'react';
import { apiService, actions } from '../services/api';
import { formatCurrency } from '../utils/format';
import { BarChart3, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const Reportes = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchPedidos();
  }, []);

  useEffect(() => {
    generateReport();
  }, [pedidos, fechaInicio, fechaFin]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await apiService.post({ action: actions.GET_PEDIDOS });
      if (response.success) {
        setPedidos(response.data || []);
      }
    } catch (error) {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    let filtered = [...pedidos];
    if (fechaInicio) {
      filtered = filtered.filter(p => p.Fecha_Registro && new Date(p.Fecha_Registro) >= new Date(fechaInicio));
    }
    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => p.Fecha_Registro && new Date(p.Fecha_Registro) <= fin);
    }
    let totalPedidos = filtered.length;
    let totalMontos = 0;
    let totalAbonos = 0;
    let totalSaldos = 0;
    const porEstado = { Pendiente: 0, 'En proceso': 0, 'Listo para entregar': 0, Entregado: 0, Anulado: 0 };
    const porPrenda = {};
    filtered.forEach(p => {
      const esAnulado = (p.Estado || '').toLowerCase() === 'anulado';
      if (!esAnulado) {
        totalMontos += parseFloat(p.Monto_Total || 0);
        totalAbonos += parseFloat(p.Abono_Inicial || 0);
        totalSaldos += parseFloat(p.Saldo_Pendiente || 0);
      }
      const estado = p.Estado || 'Sin estado';
      if (porEstado[estado] !== undefined) porEstado[estado]++;
      else porEstado[estado] = (porEstado[estado] || 0) + 1;
      const prenda = p.Tipo_Prenda || 'Otros';
      porPrenda[prenda] = (porPrenda[prenda] || 0) + 1;
    });
    setReportData({ totalPedidos, totalMontos, totalAbonos, totalSaldos, porEstado, porPrenda, filtered });
  };

  const exportCSV = () => {
    if (!reportData) return;
    const headers = ['ID_Pedido,Nombre_Completo,Fecha_Registro,Fecha_Entrega,Tipo_Prenda,Descripcion,Monto_Total,Abono_Inicial,Saldo_Pendiente,Estado,Motivo_Anulacion,URL_Fotografia'];
    const rows = reportData.filtered.map(p => {
      const desc = (p.Descripcion || '').replace(/,/g, ';').replace(/\n/g, ' ');
      const motivo = (p.Motivo_Anulacion || '').replace(/,/g, ';').replace(/\n/g, ' ');
      return `${p.ID_Pedido},"${p.Nombre_Completo}",${p.Fecha_Registro},${p.Fecha_Entrega},"${p.Tipo_Prenda}","${desc}",${p.Monto_Total},${p.Abono_Inicial},${p.Saldo_Pendiente},"${p.Estado}","${motivo}","${p.URL_Fotografia || ''}"`;
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reportes</h1>
        <button onClick={exportCSV} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mt-4 md:mt-0">
          <Download size={18} className="mr-2" />Exportar CSV
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFechaInicio(''); setFechaFin(''); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Limpiar</button>
          </div>
        </div>
      </div>
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Pedidos</p>
            <p className="text-2xl font-bold">{reportData.totalPedidos}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Monto Total</p>
            <p className="text-2xl font-bold">{formatCurrency(reportData.totalMontos)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Abonos</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalAbonos)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Saldos Pendientes</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totalSaldos)}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Estado</h2>
          {reportData && Object.entries(reportData.porEstado).map(([estado, count]) => (
            <div key={estado} className="flex justify-between py-2 border-b">
              <span>{estado}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Tipo de Prenda</h2>
          {reportData && Object.entries(reportData.porPrenda).map(([prenda, count]) => (
            <div key={prenda} className="flex justify-between py-2 border-b">
              <span>{prenda}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reportes;
