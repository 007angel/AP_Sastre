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
    if (!photoData) {
      return { success: false, message: 'No se proporcionaron datos de la imagen' };
    }

    const raw = Utilities.base64Decode(photoData);
    if (raw.length > 10 * 1024 * 1024) {
      return { success: false, message: 'La imagen supera los 10MB' };
    }
    const realType = detectImageType(raw);
    if (!realType) {
      return { success: false, message: 'El archivo no es una imagen valida (JPG, PNG, WEBP o GIF)' };
    }
    const allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    let safeName = (fileName || 'foto').replace(/[^\w.\-áéíóúñü]+/gi, '_');
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(safeName)) safeName += allowed[realType];
    safeName = 'pedido_' + new Date().getTime() + '_' + safeName;

    const folder = getOrCreateFolder();
    const blob = Utilities.newBlob(raw, realType, safeName);
    const file = folder.createFile(blob);
    
    // Hacer el archivo accesible públicamente para visualización
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { success: true, url: file.getUrl() };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function getOrCreateFolder() {
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID !== 'TU_ID_DE_CARPETA_DRIVE') {
    try {
      return DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (e) {
      // Si el ID no es válido, crear nueva carpeta
    }
  }
  const folderName = 'Sastreria_Fotos';
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}
