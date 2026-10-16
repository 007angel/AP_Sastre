function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getPedidosSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(PEDIDOS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PEDIDOS_SHEET);
    const headers = ['ID_Pedido', 'Nombre_Completo', 'Fecha_Registro', 'Fecha_Entrega', 'Tipo_Prenda', 'Descripcion', 'Monto_Total', 'Abono_Inicial', 'Saldo_Pendiente', 'URL_Fotografia', 'Estado', 'Ultima_Actualizacion', 'Motivo_Anulacion'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (headers.indexOf('Motivo_Anulacion') === -1) {
      sheet.getRange(1, lastCol + 1).setValue('Motivo_Anulacion');
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
    if (!pedido.montoTotal || parseFloat(pedido.montoTotal) <= 0) {
      return { success: false, message: 'El monto total debe ser mayor a 0' };
    }
    if (parseFloat(pedido.abonoInicial || 0) < 0) {
      return { success: false, message: 'El abono inicial no puede ser negativo' };
    }
    if (parseFloat(pedido.abonoInicial || 0) > parseFloat(pedido.montoTotal)) {
      return { success: false, message: 'El abono inicial no puede superar el monto total' };
    }
    
    const sheet = getPedidosSheet();
    const lastRow = sheet.getLastRow();
    const idPedido = lastRow === 1 ? 1001 : parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
    
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    const rowData = [
      idPedido,
      pedido.nombreCompleto,
      now,
      Utilities.formatDate(new Date(pedido.fechaEntrega), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      pedido.tipoPrenda,
      pedido.descripcion || '',
      parseFloat(pedido.montoTotal).toFixed(2),
      parseFloat(pedido.abonoInicial || 0).toFixed(2),
      parseFloat(pedido.saldoPendiente || 0).toFixed(2),
      pedido.urlFotografia || '',
      pedido.estado || 'Pendiente',
      now
    ];
    
    sheet.appendRow(rowData);
    
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
        sheet.getRange(i + 1, 2).setValue(pedido.nombreCompleto);
        sheet.getRange(i + 1, 4).setValue(Utilities.formatDate(new Date(pedido.fechaEntrega), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
        sheet.getRange(i + 1, 5).setValue(pedido.tipoPrenda);
        sheet.getRange(i + 1, 6).setValue(pedido.descripcion || '');
        sheet.getRange(i + 1, 7).setValue(parseFloat(pedido.montoTotal).toFixed(2));
        sheet.getRange(i + 1, 8).setValue(parseFloat(pedido.abonoInicial || 0).toFixed(2));
        sheet.getRange(i + 1, 9).setValue(parseFloat(pedido.saldoPendiente || 0).toFixed(2));
        sheet.getRange(i + 1, 10).setValue(pedido.urlFotografia || '');
        sheet.getRange(i + 1, 11).setValue(pedido.estado || 'Pendiente');
        sheet.getRange(i + 1, 12).setValue(now);
        
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
        return { success: true, message: 'Pedido anulado correctamente' };
      }
    }
    return { success: false, message: 'Pedido no encontrado' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
