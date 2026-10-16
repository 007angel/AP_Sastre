import React, { useEffect, useState } from 'react';
import { apiService, actions } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { Package, Clock, RefreshCw, CheckCircle, AlertTriangle, DollarSign, Wallet, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    listosParaEntregar: 0,
    entregados: 0,
    anulados: 0,
    atrasados: 0,
    totalMontos: 0,
    totalSaldos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pedidosAtrasados, setPedidosAtrasados] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.post({
        action: actions.GET_PEDIDOS,
      });
      if (response.success) {
        const pedidos = response.data || [];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let total = pedidos.length;
        let pendientes = 0;
        let enProceso = 0;
        let listosParaEntregar = 0;
        let entregados = 0;
        let anulados = 0;
        let atrasados = 0;
        let totalMontos = 0;
        let totalSaldos = 0;
        let atrasadosList = [];

        pedidos.forEach((p) => {
          const estado = (p.Estado || '').toLowerCase().trim();
          if (estado === 'anulado') {
            anulados++;
            return;
          }
          if (estado === 'pendiente') pendientes++;
          else if (estado === 'en proceso') enProceso++;
          else if (estado === 'listo para entregar') listosParaEntregar++;
          else if (estado === 'entregado') entregados++;

          totalMontos += parseFloat(p.Monto_Total || 0);
          totalSaldos += parseFloat(p.Saldo_Pendiente || 0);

          if (estado !== 'entregado' && p.Fecha_Entrega) {
            const fechaEntrega = new Date(p.Fecha_Entrega);
            fechaEntrega.setHours(23, 59, 59, 999);
            if (fechaEntrega < hoy) {
              atrasados++;
              atrasadosList.push(p);
            }
          }
        });

        setStats({
          total,
          pendientes,
          enProceso,
          listosParaEntregar,
          entregados,
          anulados,
          atrasados,
          totalMontos,
          totalSaldos,
        });
        setPedidosAtrasados(atrasadosList.slice(0, 10));
      }
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={color} size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total de pedidos" value={stats.total} icon={Package} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard title="Pendientes" value={stats.pendientes} icon={Clock} color="text-yellow-600" bgColor="bg-yellow-100" />
        <StatCard title="En proceso" value={stats.enProceso} icon={RefreshCw} color="text-orange-600" bgColor="bg-orange-100" />
        <StatCard title="Listos para entregar" value={stats.listosParaEntregar} icon={CheckCircle} color="text-green-600" bgColor="bg-green-100" />
        <StatCard title="Entregados" value={stats.entregados} icon={CheckCircle} color="text-emerald-600" bgColor="bg-emerald-100" />
        <StatCard title="Anulados" value={stats.anulados} icon={Ban} color="text-gray-600" bgColor="bg-gray-200" />
        <StatCard title="Atrasados" value={stats.atrasados} icon={AlertTriangle} color="text-red-600" bgColor="bg-red-100" />
        <StatCard title="Total montos" value={formatCurrency(stats.totalMontos)} icon={DollarSign} color="text-purple-600" bgColor="bg-purple-100" />
        <StatCard title="Saldos pendientes" value={formatCurrency(stats.totalSaldos)} icon={Wallet} color="text-red-600" bgColor="bg-red-100" />
      </div>

      {pedidosAtrasados.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
            <AlertTriangle className="mr-2" />
            Pedidos atrasados ({stats.atrasados})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prenda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Entrega</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pedidosAtrasados.map((pedido) => (
                  <tr key={pedido.ID_Pedido}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.ID_Pedido}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pedido.Nombre_Completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pedido.Tipo_Prenda}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{formatDate(pedido.Fecha_Entrega)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pedido.Estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
