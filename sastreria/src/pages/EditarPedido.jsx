import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, actions } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, X, Camera } from 'lucide-react';
import PrendasDetalle, { calcTotal } from '../components/PrendasDetalle';

const estadoOptions = ['Pendiente', 'En proceso', 'Listo para entregar', 'Entregado', 'Anulado'];

const EditarPedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    fechaEntrega: '',
    descripcion: '',
    abonoInicial: '',
    estado: 'Pendiente',
    motivoAnulacion: '',
    telefono: '',
  });
  const [items, setItems] = useState([
    { tipoPrenda: 'Pantalón', cantidad: 1, precioUnitario: '' },
  ]);

  useEffect(() => {
    fetchPedido();
  }, [id]);

  const fetchPedido = async () => {
    try {
      setLoading(true);
      const response = await apiService.post({
        action: actions.GET_PEDIDO_BY_ID,
        pedidoId: id,
      });
      if (response.success && response.data) {
        const p = response.data;
        setFormData({
          nombreCompleto: p.Nombre_Completo || '',
          fechaEntrega: p.Fecha_Entrega || '',
          descripcion: p.Descripcion || '',
          abonoInicial: p.Abono_Inicial || '',
          estado: p.Estado || 'Pendiente',
          motivoAnulacion: p.Motivo_Anulacion || '',
          telefono: p.Telefono || '',
        });
        if (p.items && p.items.length) {
          setItems(p.items.map((it) => ({
            tipoPrenda: it.Tipo_Prenda || 'Pantalón',
            cantidad: it.Cantidad || 1,
            precioUnitario: it.Precio_Unitario || '',
          })));
        } else {
          setItems([{
            tipoPrenda: p.Tipo_Prenda || 'Pantalón',
            cantidad: 1,
            precioUnitario: p.Monto_Total || '',
          }]);
        }
        setCurrentPhotoUrl(p.URL_Fotografia || '');
        if (p.URL_Fotografia) {
          setPhotoPreview(p.URL_Fotografia);
        }
      } else {
        toast.error('Pedido no encontrado');
        navigate('/pedidos');
      }
    } catch (error) {
      toast.error('Error al cargar pedido');
      navigate('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setCurrentPhotoUrl('');
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calculateTotal = () => calcTotal(items);

  const calculateSaldo = () => {
    const monto = calculateTotal();
    const abono = parseFloat(formData.abonoInicial) || 0;
    const saldo = monto - abono;
    return saldo > 0 ? saldo : 0;
  };

  const validateItems = () => {
    if (!items.length) {
      toast.error('Debe agregar al menos una prenda');
      return false;
    }
    for (const it of items) {
      if (!it.tipoPrenda) {
        toast.error('Cada prenda debe tener un tipo');
        return false;
      }
      if (!parseInt(it.cantidad, 10) || parseInt(it.cantidad, 10) < 1) {
        toast.error('La cantidad debe ser al menos 1 en cada prenda');
        return false;
      }
      if (it.precioUnitario === '' || isNaN(parseFloat(it.precioUnitario)) || parseFloat(it.precioUnitario) < 0) {
        toast.error('El precio debe ser cero o mayor en cada prenda');
        return false;
      }
    }
    if (calculateTotal() <= 0) {
      toast.error('El monto total debe ser mayor a 0');
      return false;
    }
    return true;
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
    if (!validateItems()) {
      return;
    }
    if (parseFloat(formData.abonoInicial || 0) < 0) {
      toast.error('El abono inicial no puede ser negativo');
      return;
    }
    if (parseFloat(formData.abonoInicial || 0) > calculateTotal()) {
      toast.error('El abono registrado supera el nuevo total del pedido');
      return;
    }
    if (formData.estado === 'Anulado' && !formData.motivoAnulacion.trim()) {
      toast.error('El motivo de anulación es obligatorio');
      return;
    }
    try {
      setSaving(true);
      let photoUrl = currentPhotoUrl;
      if (photo) {
        const reader = new FileReader();
        const photoData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.readAsDataURL(photo);
        });
        const uploadResponse = await apiService.post({
          action: actions.UPLOAD_PHOTO,
          photoData,
          fileName: `pedido_${id}_${Date.now()}_${photo.name}`,
          mimeType: photo.type || 'image/jpeg',
        });
        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message || 'Error al subir la fotografía');
        }
        photoUrl = uploadResponse.url;
      }
      const total = calculateTotal();
      const saldo = calculateSaldo();
      const response = await apiService.post({
        action: actions.UPDATE_PEDIDO,
        pedidoId: id,
        pedido: {
          nombreCompleto: formData.nombreCompleto,
          fechaEntrega: formData.fechaEntrega,
          descripcion: formData.descripcion,
          items: items.map((it) => ({
            tipoPrenda: it.tipoPrenda,
            cantidad: parseInt(it.cantidad, 10),
            precioUnitario: parseFloat(it.precioUnitario),
          })),
          montoTotal: total,
          abonoInicial: parseFloat(formData.abonoInicial || 0),
          saldoPendiente: saldo,
          urlFotografia: photoUrl,
          estado: formData.estado,
          motivoAnulacion: formData.estado === 'Anulado' ? formData.motivoAnulacion.trim() : '',
          telefono: formData.telefono.trim(),
        },
      });
      if (response.success) {
        toast.success('Pedido actualizado correctamente');
        navigate('/pedidos');
      } else {
        throw new Error(response.message || 'Error al actualizar el pedido');
      }
    } catch (error) {
      toast.error(error.message || 'Error al actualizar el pedido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Editar Pedido #{id}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo del cliente *</label>
            <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono del cliente</label>
            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="Ej. 5555-1234" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de entrega *</label>
            <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <PrendasDetalle items={items} onChange={setItems} />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del trabajo</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto total (GTQ)</label>
            <input type="text" value={calculateTotal().toFixed(2)} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
            <p className="text-xs text-gray-500 mt-1">Calculado automáticamente desde las prendas.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abono inicial (GTQ)</label>
            <input type="number" step="0.01" min="0" name="abonoInicial" value={formData.abonoInicial} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Saldo pendiente (GTQ)</label>
            <input type="number" value={calculateSaldo().toFixed(2)} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado del pedido</label>
            <select name="estado" value={formData.estado} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
              {estadoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          {formData.estado === 'Anulado' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de anulación *</label>
              <textarea name="motivoAnulacion" value={formData.motivoAnulacion} onChange={handleChange} rows="2" className="w-full px-4 py-2 border rounded-lg" placeholder="Indique el motivo de la anulación" />
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotografía de la prenda</label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full max-w-md h-64 object-cover rounded-lg border" />
                <button type="button" onClick={removePhoto} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X size={18} /></button>
              </div>
            ) : (
              <div className="flex gap-4">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Upload size={18} className="mr-2" />Seleccionar imagen
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            <p className="text-xs text-gray-500 mt-2">Formato: JPG, PNG, WebP. Máximo 10MB.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={() => navigate('/pedidos')} className="px-6 py-3 border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditarPedido;
