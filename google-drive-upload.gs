/**
 * Google Apps Script — upload slika u Google Drive folder
 *
 * SETUP (jednom):
 * 1. Napravite folder na Google Drive-u (npr. "Venčanje — gostiju slike")
 * 2. Otvorite script.google.com → New project
 * 3. Zalepite ovaj kod, podesite FOLDER_ID i UPLOAD_TOKEN ispod
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Kopirajte Web app URL u slike.html (UPLOAD_SCRIPT_URL)
 * 6. UPLOAD_TOKEN mora biti isti u oba fajla (nasumičan string, npr. iz password generatora)
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

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const mimeType = payload.mimeType || 'image/jpeg';
    const blob = Utilities.newBlob(
      Utilities.base64Decode(payload.data),
      mimeType,
      sanitizeFileName(payload.fileName, payload.uploaderName)
    );

    folder.createFile(blob);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: 'Upload servis je aktivan' });
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
