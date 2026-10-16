// Configuración de Google Sheets y Drive
// Reemplaza estos valores con tus propios IDs después de crear los archivos
const SPREADSHEET_ID = 'TU_ID_DE_GOOGLE_SHEETS';
const DRIVE_FOLDER_ID = '1IN9DCnbyhbuyDNt-MGFfm3YABuT4YOdW';
const ACCESS_PIN = '5816';

// Nombres de las hojas
const PEDIDOS_SHEET = 'Pedidos';
const ABONOS_SHEET = 'Abonos';

function checkAuth(pin) {
  return !!pin && pin.toString() === ACCESS_PIN;
}

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'LOGIN') {
      if (checkAuth(e.parameter.pin)) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, message: 'Acceso correcto' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, message: 'PIN incorrecto' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (!checkAuth(e.parameter.pin)) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, code: 401, message: 'No autorizado' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'GET_PEDIDOS') {
      const pedidos = getPedidos();
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: pedidos }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'GET_PEDIDO_BY_ID') {
      const pedidoId = e.parameter.pedidoId;
      const pedido = getPedidoById(pedidoId);
      if (pedido) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, data: pedido }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, message: 'Pedido no encontrado' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    if (action === 'SEARCH_PEDIDOS') {
      const searchTerm = e.parameter.searchTerm;
      const pedidos = searchPedidos(searchTerm);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: pedidos }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'GET_ABONOS') {
      const pedidoId = e.parameter.pedidoId;
      const abonos = getAbonos(pedidoId);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: abonos }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'GET_DETALLE') {
      const detalle = getDetalleByPedido(e.parameter.pedidoId);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: detalle }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'GET_AUDITORIA') {
      const rows = getAuditoria(100);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: rows }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'Acción no válida' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'LOGIN') {
      if (checkAuth(data.pin)) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, message: 'Acceso correcto' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, message: 'PIN incorrecto' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (!checkAuth(data.pin)) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, code: 401, message: 'No autorizado' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'CREATE_PEDIDO') {
      const result = createPedido(data.pedido);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'UPDATE_PEDIDO') {
      const result = updatePedido(data.pedidoId, data.pedido);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'DELETE_PEDIDO') {
      const result = deletePedido(data.pedidoId);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'ANNUL_PEDIDO') {
      const result = annulPedido(data.pedidoId, data.motivo);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'GET_DETALLE') {
      const detalle = getDetalleByPedido(data.pedidoId);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: detalle }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'GET_AUDITORIA') {
      const rows = getAuditoria(100);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: rows }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'UPLOAD_PHOTO') {
      const result = uploadPhoto(data.photoData, data.fileName, data.mimeType);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'ADD_ABONO') {
      const result = addAbono(data.pedidoId, data.montoAbono, data.observaciones);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'Acción no válida' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
