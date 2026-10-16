function addAbono(pedidoId, montoAbono, observaciones) {
  try {
    const monto = parseFloat(montoAbono);
    if (!monto || monto <= 0) {
      return { success: false, message: 'El monto del abono debe ser mayor a 0' };
    }
    
    const pedido = getPedidoById(pedidoId);
    if (!pedido) {
      return { success: false, message: 'Pedido no encontrado' };
    }
    if ((pedido.Estado || '').toString() === 'Anulado') {
      return { success: false, message: 'No se pueden registrar abonos en un pedido anulado' };
    }
    
    const saldoActual = parseFloat(pedido.Saldo_Pendiente);
    const montoTotal = parseFloat(pedido.Monto_Total);
    
    if (monto > saldoActual && saldoActual > 0) {
      return { success: false, message: 'El abono no puede superar el saldo pendiente' };
    }
    if (monto > montoTotal) {
      return { success: false, message: 'El abono no puede superar el monto total' };
    }
    
    const abonosSheet = getAbonosSheet();
    const lastRow = abonosSheet.getLastRow();
    const idAbono = lastRow === 1 ? 10001 : parseInt(abonosSheet.getRange(lastRow, 1).getValue()) + 1;
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    abonosSheet.appendRow([
      idAbono,
      pedidoId,
      now,
      monto.toFixed(2),
      observaciones || ''
    ]);
    
    // Actualizar saldo pendiente
    const nuevoSaldo = saldoActual - monto;
    const nuevoAbonoTotal = (parseFloat(pedido.Abono_Inicial) + monto);
    
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
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function getAbonos(pedidoId) {
  if (!pedidoId) return [];
  const sheet = getAbonosSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const abonos = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1].toString() === pedidoId.toString()) {
      const abono = {};
      headers.forEach((header, index) => {
        abono[header] = row[index];
      });
      abonos.push(abono);
    }
  }
  return abonos;
}
