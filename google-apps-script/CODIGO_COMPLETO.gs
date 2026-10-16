// ============================================
// SASTRERIA API - CODIGO COMPLETO EN UN SOLO ARCHIVO
// Pegar todo esto en Code.gs (reemplazar lo anterior)
// ============================================
const SPREADSHEET_ID = '17kGEWzzOsLrdTMdgN1bKUVSpCTKeayfsNJcGdjMBtmI';
const DRIVE_FOLDER_ID = '1IN9DCnbyhbuyDNt-MGFfm3YABuT4YOdW';
const PEDIDOS_SHEET = 'Pedidos';
const ABONOS_SHEET = 'Abonos';

function doGet(e) {
  try {
    const action = e.parameter.action;
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
    return json({ success: false, message: 'Accion no valida' });
  } catch (error) {
    return json({ success: false, message: error.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
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
    const headers = ['ID_Pedido','Nombre_Completo','Fecha_Registro','Fecha_Entrega','Tipo_Prenda','Descripcion','Monto_Total','Abono_Inicial','Saldo_Pendiente','URL_Fotografia','Estado','Ultima_Actualizacion','Motivo_Anulacion'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    ensureMotivoColumn(sheet);
  }
  return sheet;
}

function ensureMotivoColumn(sheet) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.indexOf('Motivo_Anulacion') === -1) {
    sheet.getRange(1, lastCol + 1).setValue('Motivo_Anulacion');
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
    if (!pedido.montoTotal || parseFloat(pedido.montoTotal) <= 0) return { success: false, message: 'El monto total debe ser mayor a 0' };
    if (parseFloat(pedido.abonoInicial || 0) < 0) return { success: false, message: 'El abono inicial no puede ser negativo' };
    if (parseFloat(pedido.abonoInicial || 0) > parseFloat(pedido.montoTotal)) return { success: false, message: 'El abono inicial no puede superar el monto total' };
    const sheet = getPedidosSheet();
    const lastRow = sheet.getLastRow();
    const idPedido = lastRow <= 1 ? 1001 : parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([idPedido, pedido.nombreCompleto, now,
      Utilities.formatDate(new Date(pedido.fechaEntrega), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      pedido.tipoPrenda, pedido.descripcion || '',
      parseFloat(pedido.montoTotal).toFixed(2), parseFloat(pedido.abonoInicial || 0).toFixed(2),
      parseFloat(pedido.saldoPendiente || 0).toFixed(2), pedido.urlFotografia || '',
      pedido.estado || 'Pendiente', now]);
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
        const nuevoEstado = pedido.estado || 'Pendiente';
        sheet.getRange(i + 1, 2).setValue(pedido.nombreCompleto);
        sheet.getRange(i + 1, 4).setValue(Utilities.formatDate(new Date(pedido.fechaEntrega), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
        sheet.getRange(i + 1, 5).setValue(pedido.tipoPrenda);
        sheet.getRange(i + 1, 6).setValue(pedido.descripcion || '');
        sheet.getRange(i + 1, 7).setValue(parseFloat(pedido.montoTotal).toFixed(2));
        sheet.getRange(i + 1, 8).setValue(parseFloat(pedido.abonoInicial || 0).toFixed(2));
        sheet.getRange(i + 1, 9).setValue(parseFloat(pedido.saldoPendiente || 0).toFixed(2));
        sheet.getRange(i + 1, 10).setValue(pedido.urlFotografia || '');
        sheet.getRange(i + 1, 11).setValue(nuevoEstado);
        sheet.getRange(i + 1, 12).setValue(now);
        if (idxMotivo > 0) {
          sheet.getRange(i + 1, idxMotivo).setValue(nuevoEstado === 'Anulado' ? (pedido.motivoAnulacion || '') : '');
        }
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

function uploadPhoto(photoData, fileName, mimeType) {
  try {
    if (!photoData) return { success: false, message: 'No se proporcionaron datos de la imagen' };
    const allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    let safeMime = allowed[mimeType] ? mimeType : 'image/jpeg';
    let safeName = (fileName || 'foto').replace(/[^\w.\-áéíóúñü]+/gi, '_');
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(safeName)) safeName += allowed[safeMime];
    safeName = 'pedido_' + new Date().getTime() + '_' + safeName;
    const folder = getOrCreateFolder();
    const blob = Utilities.newBlob(Utilities.base64Decode(photoData), safeMime, safeName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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
  const ph = ['ID_Pedido','Nombre_Completo','Fecha_Registro','Fecha_Entrega','Tipo_Prenda','Descripcion','Monto_Total','Abono_Inicial','Saldo_Pendiente','URL_Fotografia','Estado','Ultima_Actualizacion','Motivo_Anulacion'];
  ps.getRange(1, 1, 1, ph.length).setValues([ph]);
  ps.setFrozenRows(1);
  let as = ss.getSheetByName(ABONOS_SHEET);
  if (!as) as = ss.insertSheet(ABONOS_SHEET);
  const ah = ['ID_Abono','ID_Pedido','Fecha_Abono','Monto_Abono','Observaciones'];
  as.getRange(1, 1, 1, ah.length).setValues([ah]);
  as.setFrozenRows(1);
}
