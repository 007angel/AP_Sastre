function uploadPhoto(photoData, fileName, mimeType) {
  try {
    if (!photoData) {
      return { success: false, message: 'No se proporcionaron datos de la imagen' };
    }

    const allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    let safeMime = allowed[mimeType] ? mimeType : 'image/jpeg';
    let safeName = (fileName || 'foto').replace(/[^\w.\-áéíóúñü]+/gi, '_');
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(safeName)) safeName += allowed[safeMime];
    safeName = 'pedido_' + new Date().getTime() + '_' + safeName;

    const folder = getOrCreateFolder();
    const decodedBytes = Utilities.base64Decode(photoData);
    const blob = Utilities.newBlob(decodedBytes, safeMime, safeName);
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
