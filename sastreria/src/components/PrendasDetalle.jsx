import React from 'react';
import { Plus, X } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export const prendaOptions = [
  'Pantalón',
  'Camisa',
  'Traje',
  'Vestido',
  'Saco',
  'Uniforme',
  'Reparación',
  'Blusa',
  'Falda',
  'Otros',
];

export const emptyPrenda = () => ({ tipoPrenda: 'Pantalón', cantidad: 1, precioUnitario: '' });

export const calcSubtotal = (it) =>
  (parseInt(it.cantidad, 10) || 0) * (parseFloat(it.precioUnitario) || 0);

export const calcTotal = (items) =>
  Math.round(items.reduce((s, it) => s + calcSubtotal(it), 0) * 100) / 100;

const PrendasDetalle = ({ items, onChange }) => {
  const updateItem = (index, field, value) => {
    onChange(items.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItem = () => onChange([...items, emptyPrenda()]);

  const removeItem = (index) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">Prendas del pedido *</label>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-2 md:grid-cols-12 gap-2 items-end border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="col-span-2 md:col-span-4">
              <label className="block text-xs text-gray-500 mb-1">Tipo de prenda</label>
              <select
                value={it.tipoPrenda}
                onChange={(e) => updateItem(idx, 'tipoPrenda', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {prendaOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                step="1"
                value={it.cantidad}
                onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-1 md:col-span-3">
              <label className="block text-xs text-gray-500 mb-1">Precio unit. (GTQ)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={it.precioUnitario}
                onChange={(e) => updateItem(idx, 'precioUnitario', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Subtotal</label>
              <p className="px-1 py-2 font-semibold text-gray-900">{formatCurrency(calcSubtotal(it))}</p>
            </div>
            <div className="col-span-1 md:col-span-1 flex md:justify-end">
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={items.length <= 1}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                title="Quitar prenda"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
        >
          <Plus size={18} className="mr-2" />
          Agregar prenda
        </button>
        <p className="text-lg font-bold text-gray-900">
          Total: <span className="text-blue-700">{formatCurrency(calcTotal(items))}</span>
        </p>
      </div>
    </div>
  );
};

export default PrendasDetalle;
