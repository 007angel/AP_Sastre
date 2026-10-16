function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getPedidosSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(PEDIDOS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PEDIDOS_SHEET);
    const headers = ['ID_Pedido', 'Nombre_Completo', 'Fecha_Registro', 'Fecha_Entrega', 'Tipo_Prenda', 'Descripcion', 'Monto_Total', 'Abono_Inicial', 'Saldo_Pendiente', 'URL_Fotografia', 'Estado', 'Ultima_Actualizacion', 'Motivo_Anulacion', 'Telefono'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (headers.indexOf('Motivo_Anulacion') === -1) {
      sheet.getRange(1, lastCol + 1).setValue('Motivo_Anulacion');
    }
    const headers2 = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers2.indexOf('Telefono') === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue('Telefono');
    }
  }
  return sheet;
}

function getAbonosSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(ABONOS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ABONOS_SHEET);
    const headers = ['ID_Abono', 'ID_Pedido', 'Fecha_Abono', 'Monto_Abono', 'Observaciones'];
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
    const headers = ['Fecha', 'Accion', 'ID_Pedido', 'Detalle'];
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
  let sheet = ss.getSheetByName('Detalle');
  if (!sheet) {
    sheet = ss.insertSheet('Detalle');
    const headers = ['ID_Detalle', 'ID_Pedido', 'Tipo_Prenda', 'Cantidad', 'Precio_Unitario', 'Subtotal'];
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
    headers.forEach((header, index) => { d[header] = data[i][index]; });
    out.push(d);
  }
  return out;
}

function getDetalleByPedido(pedidoId) {
  if (!pedidoId) return [];
  return getAllDetalle().filter(d => d.ID_Pedido.toString() === pedidoId.toString());
}

function validateItems(items) {
  if (!items || !items.length) return 'Debe agregar al menos una prenda al pedido';
  for (let i = 0; i < items.length; i++) {
    const cant = parseInt(items[i].cantidad, 10);
    const precio = parseFloat(items[i].precioUnitario);
    if (!items[i].tipoPrenda) return 'Cada prenda debe tener un tipo';
    if (!cant || cant < 1) return 'La cantidad debe ser al menos 1 en cada prenda';
    if (isNaN(precio) || precio < 0) return 'El precio debe ser cero o mayor en cada prenda';
  }
  return null;
}

function computeItems(items) {
  let total = 0;
  const clean = items.map(it => {
    const cantidad = parseInt(it.cantidad, 10);
    const precioUnitario = Math.round(parseFloat(it.precioUnitario) * 100) / 100;
    const subtotal = Math.round(cantidad * precioUnitario * 100) / 100;
    total = Math.round((total + subtotal) * 100) / 100;
    return { tipoPrenda: it.tipoPrenda, cantidad, precioUnitario, subtotal };
  });
  return { items: clean, total };
}

function buildResumenPrendas(items) {
  return items.map(it => it.cantidad + 'x ' + it.tipoPrenda).join(', ');
}

function replaceDetalle(pedidoId, items) {
  const sheet = getDetalleSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1].toString() === pedidoId.toString()) sheet.deleteRow(i + 1);
  }
  const lastRow = sheet.getLastRow();
  let nextId = lastRow <= 1 ? 20001 : parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
  items.forEach(it => {
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
    const row = data[i];
    if (row[0] === '') continue;
    const pedido = {};
    headers.forEach((header, index) => {
      pedido[header] = row[index];
    });
    pedidos.push(pedido);
  }
  const byPedido = {};
  getAllDetalle().forEach(d => {
    const k = d.ID_Pedido.toString();
    if (!byPedido[k]) byPedido[k] = [];
    byPedido[k].push(d);
  });
  pedidos.forEach(p => { p.items = byPedido[p.ID_Pedido.toString()] || []; });
  return pedidos.reverse();
}

function getPedidoById(pedidoId) {
  const pedidos = getPedidos();
  return pedidos.find(p => p.ID_Pedido.toString() === pedidoId.toString());
}

function searchPedidos(searchTerm) {
  if (!searchTerm) return getPedidos();
  const term = searchTerm.toLowerCase();
  const pedidos = getPedidos();
  return pedidos.filter(p => 
    (p.Nombre_Completo && p.Nombre_Completo.toLowerCase().includes(term)) ||
    (p.ID_Pedido && p.ID_Pedido.toString().toLowerCase().includes(term))
  );
}

function createPedido(pedido) {
  try {
    // Validaciones
    if (!pedido.nombreCompleto || pedido.nombreCompleto.trim() === '') {
      return { success: false, message: 'El nombre completo es obligatorio' };
    }
    if (!pedido.fechaEntrega) {
      return { success: false, message: 'La fecha de entrega es obligatoria' };
    }
    const itemsError = validateItems(pedido.items);
    if (itemsError) {
      return { success: false, message: itemsError };
    }
    const comp = computeItems(pedido.items);
    if (comp.total <= 0) {
      return { success: false, message: 'El monto total debe ser mayor a 0' };
    }
    if (parseFloat(pedido.abonoInicial || 0) < 0) {
      return { success: false, message: 'El abono inicial no puede ser negativo' };
    }
    if (parseFloat(pedido.abonoInicial || 0) > comp.total) {
      return { success: false, message: 'El abono inicial no puede superar el monto total' };
    }
    
    const sheet = getPedidosSheet();
    const lastRow = sheet.getLastRow();
    const idPedido = lastRow === 1 ? 1001 : parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
    
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const abono = Math.round(parseFloat(pedido.abonoInicial || 0) * 100) / 100;
    const saldo = Math.round((comp.total - abono) * 100) / 100;
    
    const head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = new Array(head.length).fill('');
    const setCol = (name, val) => { const i = head.indexOf(name); if (i >= 0) rowData[i] = val; };
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
    replaceDetalle(idPedido, comp.items);
    
    sheet.appendRow(rowData);
    logAuditoria('CREAR', idPedido, pedido.nombreCompleto + ' total ' + comp.total.toFixed(2));
    
    return { success: true, message: 'Pedido creado correctamente', idPedido: idPedido };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function updatePedido(pedidoId, pedido) {
  try {
    const sheet = getPedidosSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === pedidoId.toString()) {
        const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        const itemsError = validateItems(pedido.items);
        if (itemsError) {
          return { success: false, message: itemsError };
        }
        const comp = computeItems(pedido.items);
        if (comp.total <= 0) {
          return { success: false, message: 'El monto total debe ser mayor a 0' };
        }
        const abonoEdit = Math.round(parseFloat(pedido.abonoInicial || 0) * 100) / 100;
        if (abonoEdit > comp.total) {
          return { success: false, message: 'El abono registrado supera el nuevo total del pedido' };
        }
        const saldoEdit = Math.round((comp.total - abonoEdit) * 100) / 100;
        sheet.getRange(i + 1, 2).setValue(pedido.nombreCompleto);
        sheet.getRange(i + 1, 4).setValue(Utilities.formatDate(new Date(pedido.fechaEntrega), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
        sheet.getRange(i + 1, 5).setValue(buildResumenPrendas(comp.items));
        sheet.getRange(i + 1, 6).setValue(pedido.descripcion || '');
        sheet.getRange(i + 1, 7).setValue(comp.total.toFixed(2));
        sheet.getRange(i + 1, 8).setValue(abonoEdit.toFixed(2));
        sheet.getRange(i + 1, 9).setValue(saldoEdit.toFixed(2));
        sheet.getRange(i + 1, 10).setValue(pedido.urlFotografia || '');
        sheet.getRange(i + 1, 11).setValue(pedido.estado || 'Pendiente');
        sheet.getRange(i + 1, 12).setValue(now);
        replaceDetalle(pedidoId, comp.items);
        const headers = data[0];
        const idxMotivo = headers.indexOf('Motivo_Anulacion') + 1;
        const idxTelefono = headers.indexOf('Telefono') + 1;
        if (idxMotivo > 0) {
          sheet.getRange(i + 1, idxMotivo).setValue((pedido.estado || '') === 'Anulado' ? (pedido.motivoAnulacion || '') : '');
        }
        if (idxTelefono > 0) {
          sheet.getRange(i + 1, idxTelefono).setValue(pedido.telefono || '');
        }
        
        logAuditoria('EDITAR', pedidoId, pedido.estado || '');
        return { success: true, message: 'Pedido actualizado correctamente' };
      }
    }
    return { success: false, message: 'Pedido no encontrado' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
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
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function annulPedido(pedidoId, motivo) {
  try {
    if (!motivo || motivo.trim() === '') {
      return { success: false, message: 'El motivo de anulacion es obligatorio' };
    }
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
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
