import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, actions, setPin } from '../services/api';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = ({ onLogin }) => {
  const [pin, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error('Ingrese el PIN de acceso');
      return;
    }
    try {
      setLoading(true);
      const response = await apiService.post({
        action: actions.LOGIN,
        pin: pin.trim(),
      });
      if (response.success) {
        setPin(pin.trim());
        toast.success('Acceso correcto');
        onLogin();
        navigate('/', { replace: true });
      } else {
        toast.error(response.message || 'PIN incorrecto');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-blue-100">
            <Lock className="text-blue-600" size={28} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900">Sastrería</h1>
        <p className="text-sm text-gray-500 text-center mt-1 mb-6">Ingrese el PIN de acceso</p>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPinInput(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Verificando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};

export default Login;
