export const formatCurrency = (amount, currency = 'GTQ', locale = 'es-GT') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const normalizePhone = (phone, defaultCountryCode = '502') => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 8) return defaultCountryCode + digits;
  return digits;
};

export const buildWhatsAppUrl = (phone, message) => {
  const to = normalizePhone(phone);
  if (!to) return '';
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
};

export const buildReadyMessage = (pedido) => {
  const nombre = pedido.Nombre_Completo || 'cliente';
  const fecha = formatDate(pedido.Fecha_Entrega);
  const resumen = pedido.Tipo_Prenda || 'prenda';
  const esMultiple = (pedido.items && pedido.items.length > 1) || /,/.test(resumen);
  const sujeto = esMultiple
    ? `Sus prendas (${resumen})`
    : `Su prenda (${String(resumen).toLowerCase()})`;
  return `Hola ${nombre}, le saludamos de Sastrería. ${sujeto} con fecha de entrega ${fecha} ya se encuentra${esMultiple ? 'n listas' : ' lista'}. ¡Le esperamos!`;
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
