function createSheetsAndHeaders() {
  // Crear o inicializar hoja de Pedidos
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Hoja Pedidos
  let pedidosSheet = ss.getSheetByName(PEDIDOS_SHEET);
  if (!pedidosSheet) {
    pedidosSheet = ss.insertSheet(PEDIDOS_SHEET);
  }
  const pedidosHeaders = ['ID_Pedido', 'Nombre_Completo', 'Fecha_Registro', 'Fecha_Entrega', 'Tipo_Prenda', 'Descripcion', 'Monto_Total', 'Abono_Inicial', 'Saldo_Pendiente', 'URL_Fotografia', 'Estado', 'Ultima_Actualizacion', 'Motivo_Anulacion', 'Telefono'];
  pedidosSheet.getRange(1, 1, 1, pedidosHeaders.length).setValues([pedidosHeaders]);
  pedidosSheet.setFrozenRows(1);
  pedidosSheet.autoResizeColumns(1, pedidosHeaders.length);
  
  // Hoja Abonos
  let abonosSheet = ss.getSheetByName(ABONOS_SHEET);
  if (!abonosSheet) {
    abonosSheet = ss.insertSheet(ABONOS_SHEET);
  }
  const abonosHeaders = ['ID_Abono', 'ID_Pedido', 'Fecha_Abono', 'Monto_Abono', 'Observaciones'];
  abonosSheet.getRange(1, 1, 1, abonosHeaders.length).setValues([abonosHeaders]);
  abonosSheet.setFrozenRows(1);
  abonosSheet.autoResizeColumns(1, abonosHeaders.length);

  // Hoja Detalle
  let detalleSheet = ss.getSheetByName('Detalle');
  if (!detalleSheet) {
    detalleSheet = ss.insertSheet('Detalle');
  }
  const detalleHeaders = ['ID_Detalle', 'ID_Pedido', 'Tipo_Prenda', 'Cantidad', 'Precio_Unitario', 'Subtotal'];
  detalleSheet.getRange(1, 1, 1, detalleHeaders.length).setValues([detalleHeaders]);
  detalleSheet.setFrozenRows(1);
  detalleSheet.autoResizeColumns(1, detalleHeaders.length);
  
  // Estilos opcionales para encabezados
  pedidosSheet.getRange(1, 1, 1, pedidosHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');
  abonosSheet.getRange(1, 1, 1, abonosHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');
  detalleSheet.getRange(1, 1, 1, detalleHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');

  // Hoja Auditoria
  let auditoriaSheet = ss.getSheetByName('Auditoria');
  if (!auditoriaSheet) {
    auditoriaSheet = ss.insertSheet('Auditoria');
  }
  const auditoriaHeaders = ['Fecha', 'Accion', 'ID_Pedido', 'Detalle'];
  auditoriaSheet.getRange(1, 1, 1, auditoriaHeaders.length).setValues([auditoriaHeaders]);
  auditoriaSheet.setFrozenRows(1);
  auditoriaSheet.autoResizeColumns(1, auditoriaHeaders.length);
  auditoriaSheet.getRange(1, 1, 1, auditoriaHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');
  
  SpreadsheetApp.getUi().alert('Hojas creadas correctamente');
}

function testConnection() {
  try {
    const pedidos = getPedidos();
    SpreadsheetApp.getUi().alert('Conexión exitosa. Pedidos encontrados: ' + pedidos.length);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}
