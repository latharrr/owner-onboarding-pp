/**
 * ============================================================
 * Picapool PG Owner Onboarding — Google Apps Script
 * ============================================================
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to script.google.com → New Project
 * 2. Paste this entire file
 * 3. Replace SPREADSHEET_ID with your Google Sheets ID
 * 4. Replace SHARED_SECRET with a long random string
 * 5. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL → add to Vercel as APPS_SCRIPT_WEB_APP_URL
 * 7. Add SHARED_SECRET to Vercel as APPS_SCRIPT_SECRET
 *
 * SHEET STRUCTURE:
 * The script will auto-create these tabs if they don't exist:
 *   - Owners
 *   - Properties
 *   - RoomConfigurations
 *   - Submissions
 * ============================================================
 */

const SPREADSHEET_ID = '1rJOugosaV9MT-Sdl2adNhDIHcX2Y4E4R-hY6YeZH2YY';
const SHARED_SECRET = 'ca9f96b27e80d440ef42d20fae319bf1893c5240f925b306b9ef20e7de647895';

// ── Sheet names ───────────────────────────────────────────────
const SHEETS = {
  OWNERS: 'Owners',
  PROPERTIES: 'Properties',
  ROOM_CONFIGS: 'RoomConfigurations',
  SUBMISSIONS: 'Submissions',
  DRAFTS: 'Drafts',
};

// ── Headers ───────────────────────────────────────────────────
const HEADERS = {
  OWNERS: [
    'ownerId', 'displayId', 'name', 'phone', 'altPhone', 'email', 'address',
    'latitude', 'longitude', 'visitStatus',
    'internName', 'sessionId', 'deviceType', 'browser',
    'startedAt', 'endedAt', 'duration', 'createdAt',
  ],
  PROPERTIES: [
    'propertyId', 'displayId', 'ownerId', 'ownerDisplayId',
    'name', 'address', 'locality', 'city', 'pincode', 'googleMapsLink',
    'pgType', 'totalRooms', 'totalBeds', 'amenities',
    'foodProvided', 'mealsPerDay', 'mealsList', 'mealType', 'mealIncluded', 'mealCost',
    'noSmoking', 'noDrinking', 'noNonVeg', 'guestPolicy', 'lockInPeriod', 'noticePeriod',
    'maintenanceIncluded', 'electricityIncluded', 'electricityBilling', 'fixedElectricityAmount',
    'securityDeposit', 'tokenAmount',
    'availableFrom', 'currentVacancies', 'immediateJoining',
    'internRating', 'followUpRequired', 'voiceNoteKey',
    'photoUrls', 'videoUrls', 'documentUrls',
    'createdAt', 'updatedAt',
  ],
  ROOM_CONFIGS: [
    'configId', 'propertyId', 'propertyDisplayId', 'ownerDisplayId',
    'type', 'acType', 'furnishing', 'count', 'rentPerBed', 'deposit', 'lockInPeriod',
    'createdAt',
  ],
  SUBMISSIONS: [
    'submissionId', 'displayId', 'ownerId', 'ownerDisplayId',
    'propertyIds', 'propertyDisplayIds', 'totalProperties',
    'internName', 'sessionId', 'deviceType', 'browser',
    'latitude', 'longitude', 'startedAt', 'endedAt', 'duration',
    'visitStatus', 'createdAt',
  ],
  DRAFTS: ['sessionId', 'step', 'timestamp', 'internName'],
};

// ── Main entry point ──────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // Auth check
    if (body.secret !== SHARED_SECRET) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    const action = body.action;

    switch (action) {
      case 'CHECK_DUPLICATE':
        return jsonResponse(checkDuplicate(body.phone));

      case 'SUBMIT_ONBOARDING':
        return jsonResponse(submitOnboarding(body.payload));

      case 'SAVE_DRAFT':
        return jsonResponse(saveDraft(body.sessionId, body.step, body.timestamp));

      default:
        return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

// ── Duplicate phone check ─────────────────────────────────────
function checkDuplicate(phone) {
  const sheet = getOrCreateSheet(SHEETS.OWNERS, HEADERS.OWNERS);
  const data = sheet.getDataRange().getValues();

  // Find phone column index
  const headers = data[0];
  const phoneIdx = headers.indexOf('phone');
  if (phoneIdx === -1) return { success: true, data: { isDuplicate: false } };

  for (let i = 1; i < data.length; i++) {
    if (data[i][phoneIdx] === phone) {
      const row = {};
      headers.forEach((h, j) => { row[h] = data[i][j]; });
      return {
        success: true,
        data: {
          isDuplicate: true,
          existingOwner: {
            displayId: row.displayId,
            name: row.name,
            phone: row.phone,
            createdAt: row.createdAt,
            propertyCount: countPropertiesForOwner(row.ownerId),
          },
        },
      };
    }
  }

  return { success: true, data: { isDuplicate: false } };
}

function countPropertiesForOwner(ownerId) {
  try {
    const sheet = getOrCreateSheet(SHEETS.PROPERTIES, HEADERS.PROPERTIES);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const ownerIdIdx = headers.indexOf('ownerId');
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][ownerIdIdx] === ownerId) count++;
    }
    return count;
  } catch { return 0; }
}

// ── Submit onboarding ─────────────────────────────────────────
function submitOnboarding(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const now = new Date().toISOString();
  const { session, owner, properties } = payload;

  // 1. Generate display IDs
  const ownerDisplayId = generateDisplayId(ss, SHEETS.OWNERS, 'OWN');
  const submissionId = generateUUID();
  const submissionDisplayId = generateDisplayId(ss, SHEETS.SUBMISSIONS, 'SUB');

  // 2. Write Owner row
  const ownerSheet = getOrCreateSheet(SHEETS.OWNERS, HEADERS.OWNERS, ss);
  const ownerRow = [
    owner.ownerId, ownerDisplayId,
    owner.name, owner.phone, owner.altPhone || '', owner.email || '', owner.address,
    session.gps?.latitude || '', session.gps?.longitude || '',
    owner.visitStatus,
    session.internName, session.sessionId, session.deviceType, session.browser,
    session.startedAt || '', session.endedAt || '', session.duration || '',
    now,
  ];
  ownerSheet.appendRow(ownerRow);

  // 3. Write each property
  const propSheet = getOrCreateSheet(SHEETS.PROPERTIES, HEADERS.PROPERTIES, ss);
  const roomSheet = getOrCreateSheet(SHEETS.ROOM_CONFIGS, HEADERS.ROOM_CONFIGS, ss);
  const propertyDisplayIds = [];

  properties.forEach((prop) => {
    const propDisplayId = generateDisplayId(ss, SHEETS.PROPERTIES, 'PRP');
    propertyDisplayIds.push(propDisplayId);

    // Save voice note to Google Drive if base64 data is present
    let voiceDriveUrl = '';
    if (prop.voiceNoteBase64) {
      voiceDriveUrl = saveAudioToDrive(prop.voiceNoteBase64, propDisplayId);
    }

    const propRow = [
      prop.propertyId, propDisplayId, owner.ownerId, ownerDisplayId,
      prop.name, prop.address, prop.locality, prop.city, prop.pincode, prop.googleMapsLink || '',
      prop.pgType, prop.totalRooms, prop.totalBeds,
      (prop.amenities || []).join(', '),
      prop.foodProvided, prop.mealsPerDay || 3, (prop.mealsList || []).join(', '), prop.mealType, prop.mealIncluded, prop.mealCost || '',
      prop.noSmoking, prop.noDrinking, prop.noNonVeg,
      prop.guestPolicy, prop.lockInPeriod, prop.noticePeriod,
      prop.maintenanceIncluded, prop.electricityIncluded,
      prop.electricityBilling, prop.fixedElectricityAmount || '',
      prop.securityDeposit, prop.tokenAmount || '',
      prop.availableFrom, prop.currentVacancies, prop.immediateJoining,
      prop.internRating, prop.followUpRequired, voiceDriveUrl || prop.voiceNoteKey || '',
      (prop.photoUrls || []).join(', '),
      (prop.videoUrls || []).join(', '),
      (prop.documentUrls || []).join(', '),
      now, now,
    ];
    propSheet.appendRow(propRow);

    // 4. Write room configs
    (prop.roomConfigs || []).forEach((rc) => {
      const rcRow = [
        rc.configId, prop.propertyId, propDisplayId, ownerDisplayId,
        rc.type, rc.acType, rc.furnishing, rc.count, rc.rentPerBed, rc.deposit, rc.lockInPeriod || 1,
        now,
      ];
      roomSheet.appendRow(rcRow);
    });
  });

  // 5. Write Submission row
  const subSheet = getOrCreateSheet(SHEETS.SUBMISSIONS, HEADERS.SUBMISSIONS, ss);
  const subRow = [
    submissionId, submissionDisplayId, owner.ownerId, ownerDisplayId,
    properties.map((p) => p.propertyId).join(', '),
    propertyDisplayIds.join(', '),
    properties.length,
    session.internName, session.sessionId, session.deviceType, session.browser,
    session.gps?.latitude || '', session.gps?.longitude || '',
    session.startedAt || '', session.endedAt || '', session.duration || '',
    owner.visitStatus, now,
  ];
  subSheet.appendRow(subRow);

  return {
    success: true,
    data: {
      submissionId,
      submissionDisplayId,
      ownerDisplayId,
      propertyDisplayIds,
      createdAt: now,
    },
  };
}

// ── Save draft ────────────────────────────────────────────────
function saveDraft(sessionId, step, timestamp) {
  try {
    const sheet = getOrCreateSheet(SHEETS.DRAFTS, HEADERS.DRAFTS);
    sheet.appendRow([sessionId, step, timestamp]);
    return { success: true };
  } catch { return { success: true }; }
}

// ── Helpers ───────────────────────────────────────────────────
function getOrCreateSheet(name, headers, ss) {
  const spreadsheet = ss || SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(headers);
    // Style the header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#FF7A00');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateDisplayId(ss, sheetName, prefix) {
  const spreadsheet = ss || SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(sheetName);
  const rowCount = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0; // -1 for header
  const num = String(rowCount + 1).padStart(3, '0');
  return `${prefix}-${num}`;
}

function generateUUID() {
  return Utilities.getUuid();
}

function jsonResponse(data, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveAudioToDrive(base64Data, filename) {
  try {
    const folderName = 'Picapool Onboarding Media';
    let folders = DriveApp.getFoldersByName(folderName);
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, 'audio/webm', filename + '.webm');
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return 'Error saving to Drive: ' + err.toString();
  }
}
