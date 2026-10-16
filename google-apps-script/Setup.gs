function createSheetsAndHeaders() {
  // Crear o inicializar hoja de Pedidos
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Hoja Pedidos
  let pedidosSheet = ss.getSheetByName(PEDIDOS_SHEET);
  if (!pedidosSheet) {
    pedidosSheet = ss.insertSheet(PEDIDOS_SHEET);
  }
  const pedidosHeaders = ['ID_Pedido', 'Nombre_Completo', 'Fecha_Registro', 'Fecha_Entrega', 'Tipo_Prenda', 'Descripcion', 'Monto_Total', 'Abono_Inicial', 'Saldo_Pendiente', 'URL_Fotografia', 'Estado', 'Ultima_Actualizacion', 'Motivo_Anulacion'];
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
  
  // Estilos opcionales para encabezados
  pedidosSheet.getRange(1, 1, 1, pedidosHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');
  abonosSheet.getRange(1, 1, 1, abonosHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');
  
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
