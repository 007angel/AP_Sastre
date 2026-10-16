import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, actions } from '../services/api';
import toast from 'react-hot-toast';
import { Camera, Upload, X } from 'lucide-react';

const prendaOptions = [
  'Pantalón',
  'Camisa',
  'Traje',
  'Vestido',
  'Saco',
  'Uniforme',
  'Reparación',
  'Otros',
];

const estadoOptions = [
  'Pendiente',
  'En proceso',
  'Listo para entregar',
  'Entregado',
];

const NuevoPedido = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    fechaEntrega: '',
    tipoPrenda: 'Pantalón',
    descripcion: '',
    montoTotal: '',
    abonoInicial: '',
    estado: 'Pendiente',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 10MB');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calculateSaldo = () => {
    const monto = parseFloat(formData.montoTotal) || 0;
    const abono = parseFloat(formData.abonoInicial) || 0;
    const saldo = monto - abono;
    return saldo > 0 ? saldo : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombreCompleto.trim()) {
      toast.error('El nombre completo es obligatorio');
      return;
    }
    if (!formData.fechaEntrega) {
      toast.error('La fecha de entrega es obligatoria');
      return;
    }
    if (!formData.montoTotal || parseFloat(formData.montoTotal) <= 0) {
      toast.error('El monto total debe ser mayor a 0');
      return;
    }
    if (parseFloat(formData.abonoInicial || 0) < 0) {
      toast.error('El abono inicial no puede ser negativo');
      return;
    }

    try {
      setLoading(true);

      let photoUrl = '';
      if (photo) {
        const reader = new FileReader();
        const photoData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.readAsDataURL(photo);
        });

        const uploadResponse = await apiService.post({
          action: actions.UPLOAD_PHOTO,
          photoData,
          fileName: `pedido_${Date.now()}_${photo.name}`,
          mimeType: photo.type || 'image/jpeg',
        });

        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message || 'Error al subir la fotografía');
        }
        photoUrl = uploadResponse.url;
      }

      const saldo = calculateSaldo();
      const response = await apiService.post({
        action: actions.CREATE_PEDIDO,
        pedido: {
          nombreCompleto: formData.nombreCompleto,
          fechaEntrega: formData.fechaEntrega,
          tipoPrenda: formData.tipoPrenda,
          descripcion: formData.descripcion,
          montoTotal: parseFloat(formData.montoTotal),
          abonoInicial: parseFloat(formData.abonoInicial || 0),
          saldoPendiente: saldo,
          urlFotografia: photoUrl,
          estado: formData.estado,
        },
      });

      if (response.success) {
        toast.success('Pedido registrado correctamente');
        navigate('/pedidos');
      } else {
        throw new Error(response.message || 'Error al registrar el pedido');
      }
    } catch (error) {
      toast.error(error.message || 'Error al registrar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Nuevo Pedido</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo del cliente *</label>
            <input
              type="text"
              name="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingrese nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de entrega *</label>
            <input
              type="date"
              name="fechaEntrega"
              value={formData.fechaEntrega}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de prenda *</label>
            <select
              name="tipoPrenda"
              value={formData.tipoPrenda}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {prendaOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del trabajo</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detalles de la confección o reparación"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto total (GTQ) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="montoTotal"
              value={formData.montoTotal}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abono inicial (GTQ)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="abonoInicial"
              value={formData.abonoInicial}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Saldo pendiente (GTQ)</label>
            <input
              type="number"
              value={calculateSaldo().toFixed(2)}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado del pedido</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {estadoOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotografía de la prenda</label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full max-w-md h-64 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Upload size={18} className="mr-2" />
                  Seleccionar imagen
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Camera size={18} className="mr-2" />
                  Tomar fotografía
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">Formato: JPG, PNG, WebP. Máximo 10MB.</p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoPedido;
