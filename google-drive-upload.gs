/**
 * Google Apps Script — upload slika u Google Drive folder
 *
 * SETUP:
 * 1. Napravite folder na Google Drive-u
 * 2. Kopirajte SAMO ID iz URL-a: drive.google.com/drive/folders/XXXXXXXX
 * 3. Podesite FOLDER_ID i UPLOAD_TOKEN ispod (isti token kao u slike.html)
 * 4. Pokrenite testFolderAccess() iz editora (Run) i odobrite pristup Drive-u
 * 5. Deploy → New deployment → Web app (Execute as: Me, Anyone)
 * 6. Nakon svake izmene koda: Deploy → Manage deployments → Edit → New version
 */

const FOLDER_ID = 'PASTE_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';
const UPLOAD_TOKEN = 'PASTE_YOUR_SECRET_TOKEN_HERE';

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Nema podataka' });
    }

    const payload = JSON.parse(e.postData.contents);

    if (payload.token !== UPLOAD_TOKEN) {
      return jsonResponse({ ok: false, error: 'Neispravan token' });
    }

    if (!payload.data || !payload.fileName) {
      return jsonResponse({ ok: false, error: 'Nedostaje fajl' });
    }

    const folder = getUploadFolder();
    const mimeType = payload.mimeType || 'image/jpeg';
    const blob = Utilities.newBlob(
      Utilities.base64Decode(payload.data),
      mimeType,
      sanitizeFileName(payload.fileName, payload.uploaderName)
    );

    folder.createFile(blob);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) });
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: 'Upload servis je aktivan' });
}

function getUploadFolder() {
  const folderId = extractFolderId(FOLDER_ID);

  if (!folderId || folderId.includes('PASTE_YOUR')) {
    throw new Error('FOLDER_ID nije podešen. Unesite ID Google Drive foldera u script.');
  }

  try {
    return DriveApp.getFolderById(folderId);
  } catch (err) {
    throw new Error(
      'Ne mogu da pristupim folderu. Proverite FOLDER_ID, pokrenite testFolderAccess() i odobrite pristup Drive-u.'
    );
  }
}

function extractFolderId(value) {
  const trimmed = String(value || '').trim();
  const match = trimmed.match(/[-\w]{25,}/);
  return match ? match[0] : trimmed;
}

function testFolderAccess() {
  const folder = getUploadFolder();
  Logger.log('OK — folder: ' + folder.getName());
}

function sanitizeFileName(originalName, uploaderName) {
  const ext = originalName.includes('.')
    ? originalName.slice(originalName.lastIndexOf('.'))
    : '.jpg';
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 8) || '.jpg';
  const safeUploader = (uploaderName || 'gost')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30) || 'gost';
  const timestamp = Utilities.formatDate(new Date(), 'Europe/Belgrade', 'yyyy-MM-dd_HH-mm-ss');
  return timestamp + '_' + safeUploader + safeExt;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
