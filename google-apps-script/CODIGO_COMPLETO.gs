// ============================================
// SASTRERIA API - CODIGO COMPLETO EN UN SOLO ARCHIVO
// Pegar todo esto en Code.gs (reemplazar lo anterior)
// ============================================
const SPREADSHEET_ID = '17kGEWzzOsLrdTMdgN1bKUVSpCTKeayfsNJcGdjMBtmI';
const DRIVE_FOLDER_ID = '1IN9DCnbyhbuyDNt-MGFfm3YABuT4YOdW';
const ACCESS_PIN = '3087';
const PEDIDOS_SHEET = 'Pedidos';
const ABONOS_SHEET = 'Abonos';
const DETALLE_SHEET = 'Detalle';

function checkAuth(pin) {
  return !!pin && pin.toString() === ACCESS_PIN;
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'LOGIN') {
      if (checkAuth(e.parameter.pin)) return json({ success: true, message: 'Acceso correcto' });
      return json({ success: false, message: 'PIN incorrecto' });
    }
    if (!checkAuth(e.parameter.pin)) {
      return json({ success: false, code: 401, message: 'No autorizado' });
    }
    if (action === 'GET_PEDIDOS') {
      return json({ success: true, data: getPedidos() });
    }
    if (action === 'GET_PEDIDO_BY_ID') {
      const pedido = getPedidoById(e.parameter.pedidoId);
      if (pedido) return json({ success: true, data: pedido });
      return json({ success: false, message: 'Pedido no encontrado' });
    }
    if (action === 'SEARCH_PEDIDOS') {
      return json({ success: true, data: searchPedidos(e.parameter.searchTerm) });
    }
    if (action === 'GET_ABONOS') {
      return json({ success: true, data: getAbonos(e.parameter.pedidoId) });
    }
    if (action === 'GET_DETALLE') {
      return json({ success: true, data: getDetalleByPedido(e.parameter.pedidoId) });
    }
    if (action === 'GET_AUDITORIA') {
      return json({ success: true, data: getAuditoria(100) });
    }
    return json({ success: false, message: 'Accion no valida' });
  } catch (error) {
    return json({ success: false, message: error.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    if (action === 'LOGIN') {
      if (checkAuth(data.pin)) return json({ success: true, message: 'Acceso correcto' });
      return json({ success: false, message: 'PIN incorrecto' });
    }
    if (!checkAuth(data.pin)) {
      return json({ success: false, code: 401, message: 'No autorizado' });
    }
    if (action === 'CREATE_PEDIDO') return json(createPedido(data.pedido));
    if (action === 'UPDATE_PEDIDO') return json(updatePedido(data.pedidoId, data.pedido));
    if (action === 'DELETE_PEDIDO') return json(deletePedido(data.pedidoId));
    if (action === 'ANNUL_PEDIDO') return json(annulPedido(data.pedidoId, data.motivo));
    if (action === 'UPLOAD_PHOTO') return json(uploadPhoto(data.photoData, data.fileName, data.mimeType));
    if (action === 'ADD_ABONO') return json(addAbono(data.pedidoId, data.montoAbono, data.observaciones));
    // Compatibilidad: frontend envia GET_PEDIDOS por POST tambien
    if (action === 'GET_PEDIDOS') return json({ success: true, data: getPedidos() });
    if (action === 'GET_PEDIDO_BY_ID') {
      const pedido = getPedidoById(data.pedidoId);
      if (pedido) return json({ success: true, data: pedido });
      return json({ success: false, message: 'Pedido no encontrado' });
    }
    if (action === 'SEARCH_PEDIDOS') return json({ success: true, data: searchPedidos(data.searchTerm) });
    if (action === 'GET_ABONOS') return json({ success: true, data: getAbonos(data.pedidoId) });
    if (action === 'GET_DETALLE') return json({ success: true, data: getDetalleByPedido(data.pedidoId) });
    if (action === 'GET_AUDITORIA') return json({ success: true, data: getAuditoria(100) });
    return json({ success: false, message: 'Accion no valida' });
  } catch (error) {
    return json({ success: false, message: error.toString() });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() { return SpreadsheetApp.openById(SPREADSHEET_ID); }

function getPedidosSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(PEDIDOS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PEDIDOS_SHEET);
    const headers = ['ID_Pedido','Nombre_Completo','Fecha_Registro','Fecha_Entrega','Tipo_Prenda','Descripcion','Monto_Total','Abono_Inicial','Saldo_Pendiente','URL_Fotografia','Estado','Ultima_Actualizacion','Motivo_Anulacion','Telefono'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    ensureColumn(sheet, 'Motivo_Anulacion');
    ensureColumn(sheet, 'Telefono');
  }
  return sheet;
}

function ensureColumn(sheet, name) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.indexOf(name) === -1) {
    sheet.getRange(1, lastCol + 1).setValue(name);
  }
}

function getAbonosSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(ABONOS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ABONOS_SHEET);
    const headers = ['ID_Abono','ID_Pedido','Fecha_Abono','Monto_Abono','Observaciones'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getAuditoriaSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Auditoria');
  if (!sheet) {
    sheet = ss.insertSheet('Auditoria');
    const headers = ['Fecha','Accion','ID_Pedido','Detalle'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function logAuditoria(accion, pedidoId, detalle) {
  try {
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    getAuditoriaSheet().appendRow([now, accion, pedidoId || '', detalle || '']);
  } catch (e) {}
}

function getAuditoria(limit) {
  const sheet = getAuditoriaSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const rows = [];
  const max = limit || 100;
  for (let i = data.length - 1; i >= 1; i--) {
    rows.push({ Fecha: data[i][0], Accion: data[i][1], ID_Pedido: data[i][2], Detalle: data[i][3] });
    if (rows.length >= max) break;
  }
  return rows;
}

function getDetalleSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(DETALLE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(DETALLE_SHEET);
    const headers = ['ID_Detalle','ID_Pedido','Tipo_Prenda','Cantidad','Precio_Unitario','Subtotal'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getAllDetalle() {
  const sheet = getDetalleSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === '') continue;
    const d = {};
    headers.forEach(function(h, idx) { d[h] = data[i][idx]; });
    out.push(d);
  }
  return out;
}

function getDetalleByPedido(pedidoId) {
  if (!pedidoId) return [];
  return getAllDetalle().filter(function(d) { return d.ID_Pedido.toString() === pedidoId.toString(); });
}

function nextDetalleId() {
  const sheet = getDetalleSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 20001;
  return parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
}

function validateItems(items) {
  if (!items || !items.length) return 'Debe agregar al menos una prenda al pedido';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const cant = parseInt(it.cantidad, 10);
    const precio = parseFloat(it.precioUnitario);
    if (!it.tipoPrenda) return 'Cada prenda debe tener un tipo';
    if (!cant || cant < 1) return 'La cantidad debe ser al menos 1 en cada prenda';
    if (isNaN(precio) || precio < 0) return 'El precio debe ser cero o mayor en cada prenda';
  }
  return null;
}

function computeItems(items) {
  let total = 0;
  const clean = items.map(function(it) {
    const cantidad = parseInt(it.cantidad, 10);
    const precioUnitario = Math.round(parseFloat(it.precioUnitario) * 100) / 100;
    const subtotal = Math.round(cantidad * precioUnitario * 100) / 100;
    total = Math.round((total + subtotal) * 100) / 100;
    return { tipoPrenda: it.tipoPrenda, cantidad: cantidad, precioUnitario: precioUnitario, subtotal: subtotal };
  });
  return { items: clean, total: total };
}

function buildResumenPrendas(items) {
  return items.map(function(it) { return it.cantidad + 'x ' + it.tipoPrenda; }).join(', ');
}

function replaceDetalle(pedidoId, items) {
  const sheet = getDetalleSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1].toString() === pedidoId.toString()) sheet.deleteRow(i + 1);
  }
  let nextId = nextDetalleId();
  items.forEach(function(it) {
    sheet.appendRow([nextId++, pedidoId, it.tipoPrenda, it.cantidad, it.precioUnitario.toFixed(2), it.subtotal.toFixed(2)]);
  });
}

function getPedidos() {
  const sheet = getPedidosSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const pedidos = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === '') continue;
    const pedido = {};
    headers.forEach(function(h, idx) { pedido[h] = data[i][idx]; });
    pedidos.push(pedido);
  }
  const det = getAllDetalle();
  const byPedido = {};
  det.forEach(function(d) {
    const k = d.ID_Pedido.toString();
    if (!byPedido[k]) byPedido[k] = [];
    byPedido[k].push(d);
  });
  pedidos.forEach(function(p) { p.items = byPedido[p.ID_Pedido.toString()] || []; });
  return pedidos.reverse();
}

function getPedidoById(pedidoId) {
  const pedidos = getPedidos();
  return pedidos.find(function(p) { return p.ID_Pedido.toString() === pedidoId.toString(); });
}

function searchPedidos(searchTerm) {
  if (!searchTerm) return getPedidos();
  const term = searchTerm.toLowerCase();
  return getPedidos().filter(function(p) {
    return (p.Nombre_Completo && p.Nombre_Completo.toLowerCase().indexOf(term) !== -1) ||
           (p.ID_Pedido && p.ID_Pedido.toString().toLowerCase().indexOf(term) !== -1);
  });
}

function createPedido(pedido) {
  try {
    if (!pedido.nombreCompleto || pedido.nombreCompleto.trim() === '') return { success: false, message: 'El nombre completo es obligatorio' };
    if (!pedido.fechaEntrega) return { success: false, message: 'La fecha de entrega es obligatoria' };
    const itemsError = validateItems(pedido.items);
    if (itemsError) return { success: false, message: itemsError };
    const comp = computeItems(pedido.items);
    if (comp.total <= 0) return { success: false, message: 'El monto total debe ser mayor a 0' };
    if (parseFloat(pedido.abonoInicial || 0) < 0) return { success: false, message: 'El abono inicial no puede ser negativo' };
    if (parseFloat(pedido.abonoInicial || 0) > comp.total) return { success: false, message: 'El abono inicial no puede superar el monto total' };
    const sheet = getPedidosSheet();
    const lastRow = sheet.getLastRow();
    const idPedido = lastRow <= 1 ? 1001 : parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const abono = Math.round(parseFloat(pedido.abonoInicial || 0) * 100) / 100;
    const saldo = Math.round((comp.total - abono) * 100) / 100;
    const head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = new Array(head.length).fill('');
    const setCol = (name, val) => { const i = head.indexOf(name); if (i >= 0) row[i] = val; };
    setCol('ID_Pedido', idPedido);
    setCol('Nombre_Completo', pedido.nombreCompleto);
    setCol('Fecha_Registro', now);
    setCol('Fecha_Entrega', Utilities.formatDate(new Date(pedido.fechaEntrega), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
    setCol('Tipo_Prenda', buildResumenPrendas(comp.items));
    setCol('Descripcion', pedido.descripcion || '');
    setCol('Monto_Total', comp.total.toFixed(2));
    setCol('Abono_Inicial', abono.toFixed(2));
    setCol('Saldo_Pendiente', saldo.toFixed(2));
    setCol('URL_Fotografia', pedido.urlFotografia || '');
    setCol('Estado', pedido.estado || 'Pendiente');
    setCol('Ultima_Actualizacion', now);
    setCol('Motivo_Anulacion', '');
    setCol('Telefono', pedido.telefono || '');
    sheet.appendRow(row);
    replaceDetalle(idPedido, comp.items);
    logAuditoria('CREAR', idPedido, pedido.nombreCompleto + ' total ' + comp.total.toFixed(2));
    return { success: true, message: 'Pedido creado correctamente', idPedido: idPedido };
  } catch (error) { return { success: false, message: error.toString() }; }
}

function updatePedido(pedidoId, pedido) {
  try {
    const sheet = getPedidosSheet();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === pedidoId.toString()) {
        const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        const headers = data[0];
        const idxMotivo = headers.indexOf('Motivo_Anulacion') + 1;
        const idxTelefono = headers.indexOf('Telefono') + 1;
        const nuevoEstado = pedido.estado || 'Pendiente';
        const itemsError = validateItems(pedido.items);
        if (itemsError) return { success: false, message: itemsError };
        const comp = computeItems(pedido.items);
        if (comp.total <= 0) return { success: false, message: 'El monto total debe ser mayor a 0' };
        const abonoEdit = Math.round(parseFloat(pedido.abonoInicial || 0) * 100) / 100;
        if (abonoEdit > comp.total) return { success: false, message: 'El abono registrado supera el nuevo total del pedido' };
        const saldoEdit = Math.round((comp.total - abonoEdit) * 100) / 100;
        sheet.getRange(i + 1, 2).setValue(pedido.nombreCompleto);
        sheet.getRange(i + 1, 4).setValue(Utilities.formatDate(new Date(pedido.fechaEntrega), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
        sheet.getRange(i + 1, 5).setValue(buildResumenPrendas(comp.items));
        sheet.getRange(i + 1, 6).setValue(pedido.descripcion || '');
        sheet.getRange(i + 1, 7).setValue(comp.total.toFixed(2));
        sheet.getRange(i + 1, 8).setValue(abonoEdit.toFixed(2));
        sheet.getRange(i + 1, 9).setValue(saldoEdit.toFixed(2));
        sheet.getRange(i + 1, 10).setValue(pedido.urlFotografia || '');
        replaceDetalle(pedidoId, comp.items);
        sheet.getRange(i + 1, 11).setValue(nuevoEstado);
        sheet.getRange(i + 1, 12).setValue(now);
        if (idxMotivo > 0) {
          sheet.getRange(i + 1, idxMotivo).setValue(nuevoEstado === 'Anulado' ? (pedido.motivoAnulacion || '') : '');
        }
        if (idxTelefono > 0) {
          sheet.getRange(i + 1, idxTelefono).setValue(pedido.telefono || '');
        }
        logAuditoria('EDITAR', pedidoId, nuevoEstado);
        return { success: true, message: 'Pedido actualizado correctamente' };
      }
    }
    return { success: false, message: 'Pedido no encontrado' };
  } catch (error) { return { success: false, message: error.toString() }; }
}

function deletePedido(pedidoId) {
  try {
    const sheet = getPedidosSheet();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === pedidoId.toString()) {
        sheet.deleteRow(i + 1);
        const detSheet = getDetalleSheet();
        const detData = detSheet.getDataRange().getValues();
        for (let j = detData.length - 1; j >= 1; j--) {
          if (detData[j][1].toString() === pedidoId.toString()) detSheet.deleteRow(j + 1);
        }
        logAuditoria('ELIMINAR', pedidoId, '');
        return { success: true, message: 'Pedido eliminado correctamente' };
      }
    }
    return { success: false, message: 'Pedido no encontrado' };
  } catch (error) { return { success: false, message: error.toString() }; }
}

function annulPedido(pedidoId, motivo) {
  try {
    if (!motivo || motivo.trim() === '') return { success: false, message: 'El motivo de anulacion es obligatorio' };
    const sheet = getPedidosSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idxEstado = headers.indexOf('Estado') + 1;
    const idxMotivo = headers.indexOf('Motivo_Anulacion') + 1;
    const idxUpd = headers.indexOf('Ultima_Actualizacion') + 1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === pedidoId.toString()) {
        if ((data[i][idxEstado - 1] || '').toString() === 'Anulado') {
          return { success: false, message: 'El pedido ya esta anulado' };
        }
        const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        sheet.getRange(i + 1, idxEstado).setValue('Anulado');
        if (idxMotivo > 0) sheet.getRange(i + 1, idxMotivo).setValue(motivo.trim());
        if (idxUpd > 0) sheet.getRange(i + 1, idxUpd).setValue(now);
        logAuditoria('ANULAR', pedidoId, motivo.trim());
        return { success: true, message: 'Pedido anulado correctamente' };
      }
    }
    return { success: false, message: 'Pedido no encontrado' };
  } catch (error) { return { success: false, message: error.toString() }; }
}

function addAbono(pedidoId, montoAbono, observaciones) {
  try {
    const monto = parseFloat(montoAbono);
    if (!monto || monto <= 0) return { success: false, message: 'El monto del abono debe ser mayor a 0' };
    const pedido = getPedidoById(pedidoId);
    if (!pedido) return { success: false, message: 'Pedido no encontrado' };
    if ((pedido.Estado || '').toString() === 'Anulado') return { success: false, message: 'No se pueden registrar abonos en un pedido anulado' };
    const saldoActual = parseFloat(pedido.Saldo_Pendiente);
    if (monto > saldoActual && saldoActual > 0) return { success: false, message: 'El abono no puede superar el saldo pendiente' };
    const abonosSheet = getAbonosSheet();
    const lastRow = abonosSheet.getLastRow();
    const idAbono = lastRow <= 1 ? 10001 : parseInt(abonosSheet.getRange(lastRow, 1).getValue()) + 1;
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    abonosSheet.appendRow([idAbono, pedidoId, now, monto.toFixed(2), observaciones || '']);
    const nuevoSaldo = saldoActual - monto;
    const nuevoAbonoTotal = parseFloat(pedido.Abono_Inicial) + monto;
    const pedidosSheet = getPedidosSheet();
    const data = pedidosSheet.getDataRange().getValues();
    const idxEstado = data[0].indexOf('Estado') + 1;
    let nuevoEstado = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === pedidoId.toString()) {
        pedidosSheet.getRange(i + 1, 8).setValue(nuevoAbonoTotal.toFixed(2));
        pedidosSheet.getRange(i + 1, 9).setValue(nuevoSaldo.toFixed(2));
        pedidosSheet.getRange(i + 1, 12).setValue(now);
        if (Math.round(nuevoSaldo * 100) / 100 <= 0 && idxEstado > 0) {
          pedidosSheet.getRange(i + 1, idxEstado).setValue('Entregado');
          nuevoEstado = 'Entregado';
        }
        break;
      }
    }
    let msg = 'Abono registrado correctamente';
    if (nuevoEstado) msg += '. Pedido marcado como Entregado';
    logAuditoria('ABONO', pedidoId, monto.toFixed(2));
    return { success: true, message: msg, nuevoSaldo: nuevoSaldo.toFixed(2), nuevoEstado: nuevoEstado };
  } catch (error) { return { success: false, message: error.toString() }; }
}

function getAbonos(pedidoId) {
  if (!pedidoId) return [];
  const sheet = getAbonosSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const abonos = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString() === pedidoId.toString()) {
      const abono = {};
      headers.forEach(function(h, idx) { abono[h] = data[i][idx]; });
      abonos.push(abono);
    }
  }
  return abonos;
}

function detectImageType(rawBytes) {
  const head = rawBytes.slice(0, 12).map(function(b) {
    return ('0' + ((b & 0xFF).toString(16))).slice(-2);
  }).join('');
  if (head.indexOf('ffd8ff') === 0) return 'image/jpeg';
  if (head.indexOf('89504e47') === 0) return 'image/png';
  if (head.indexOf('47494638') === 0) return 'image/gif';
  if (head.indexOf('52494646') === 0 && head.indexOf('57454250') === 8) return 'image/webp';
  return '';
}

function uploadPhoto(photoData, fileName, mimeType) {
  try {
    if (!photoData) return { success: false, message: 'No se proporcionaron datos de la imagen' };
    const raw = Utilities.base64Decode(photoData);
    if (raw.length > 10 * 1024 * 1024) return { success: false, message: 'La imagen supera los 10MB' };
    const realType = detectImageType(raw);
    if (!realType) return { success: false, message: 'El archivo no es una imagen valida (JPG, PNG, WEBP o GIF)' };
    const allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    let safeName = (fileName || 'foto').replace(/[^\w.\-áéíóúñü]+/gi, '_');
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(safeName)) safeName += allowed[realType];
    safeName = 'pedido_' + new Date().getTime() + '_' + safeName;
    const folder = getOrCreateFolder();
    const blob = Utilities.newBlob(raw, realType, safeName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    logAuditoria('FOTO', '', safeName);
    return { success: true, url: file.getUrl() };
  } catch (error) { return { success: false, message: error.toString() }; }
}

function getOrCreateFolder() {
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID !== 'TU_ID_DE_CARPETA_DRIVE') {
    try { return DriveApp.getFolderById(DRIVE_FOLDER_ID); } catch (e) {}
  }
  const folders = DriveApp.getFoldersByName('Sastreria_Fotos');
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder('Sastreria_Fotos');
}

function createSheetsAndHeaders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let ps = ss.getSheetByName(PEDIDOS_SHEET);
  if (!ps) ps = ss.insertSheet(PEDIDOS_SHEET);
  const ph = ['ID_Pedido','Nombre_Completo','Fecha_Registro','Fecha_Entrega','Tipo_Prenda','Descripcion','Monto_Total','Abono_Inicial','Saldo_Pendiente','URL_Fotografia','Estado','Ultima_Actualizacion','Motivo_Anulacion','Telefono'];
  ps.getRange(1, 1, 1, ph.length).setValues([ph]);
  ps.setFrozenRows(1);
  let as = ss.getSheetByName(ABONOS_SHEET);
  if (!as) as = ss.insertSheet(ABONOS_SHEET);
  const ah = ['ID_Abono','ID_Pedido','Fecha_Abono','Monto_Abono','Observaciones'];
  as.getRange(1, 1, 1, ah.length).setValues([ah]);
  as.setFrozenRows(1);
  let ds = ss.getSheetByName(DETALLE_SHEET);
  if (!ds) ds = ss.insertSheet(DETALLE_SHEET);
  const dh = ['ID_Detalle','ID_Pedido','Tipo_Prenda','Cantidad','Precio_Unitario','Subtotal'];
  ds.getRange(1, 1, 1, dh.length).setValues([dh]);
  ds.setFrozenRows(1);
  let us = ss.getSheetByName('Auditoria');
  if (!us) us = ss.insertSheet('Auditoria');
  const uh = ['Fecha','Accion','ID_Pedido','Detalle'];
  us.getRange(1, 1, 1, uh.length).setValues([uh]);
  us.setFrozenRows(1);
}
