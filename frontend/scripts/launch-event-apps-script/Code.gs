/* 가치가챠 앱 출시 이벤트 전용 Apps Script. 기존 이벤트 프로젝트에 덮어쓰지 않는다. */
const EVENT_ID = 'app-launch-2026';
const SCHEMA_VERSION = 1;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = 22 * 1024 * 1024;
const HEADERS = [
  '접수일시',
  '이벤트ID',
  '접수ID',
  '자가신고회원ID',
  '이름',
  '연락처',
  '응모사연',
  '개인정보동의',
  '유의사항동의',
  '약관버전',
  '사진파일ID',
  '요청해시',
  '삭제예정일',
  '운영검증상태',
];

/** 새 프로젝트에서 한 번 실행한다. 실제 접수는 켜지지 않는다. */
function setupLaunchEventStorage() {
  const properties = PropertiesService.getScriptProperties();
  if (
    properties.getProperty('SPREADSHEET_ID') ||
    properties.getProperty('PHOTO_FOLDER_ID')
  ) {
    throw new Error(
      '저장소가 이미 설정되어 있습니다. 기존 ID를 지우거나 재실행하지 마세요.',
    );
  }
  const spreadsheet = SpreadsheetApp.create('가치가챠 앱 출시 이벤트 응모');
  spreadsheet.setSpreadsheetTimeZone('Asia/Seoul');
  const sheet = spreadsheet.getSheets()[0];
  sheet.setName('응모');
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  const folder = DriveApp.createFolder('가치가챠 앱 출시 이벤트 비공개 사진');
  folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  DriveApp.getFileById(spreadsheet.getId()).setSharing(
    DriveApp.Access.PRIVATE,
    DriveApp.Permission.NONE,
  );
  properties.setProperties({
    SPREADSHEET_ID: spreadsheet.getId(),
    PHOTO_FOLDER_ID: folder.getId(),
    ACCEPTING: 'false',
    START_AT: '',
    END_AT: '',
    PRIVACY_CONTROLLER: '',
    PRIVACY_CONTACT: '',
    PRIVACY_PURPOSE: '',
    PRIVACY_RETENTION_DAYS: '',
    RULES_VERSION: '',
    MAX_SUBMISSIONS: '1000',
  });
  return {
    spreadsheetId: spreadsheet.getId(),
    photoFolderId: folder.getId(),
    accepting: false,
  };
}

function readConfig_() {
  const p = PropertiesService.getScriptProperties().getProperties();
  return {
    spreadsheetId: p.SPREADSHEET_ID || '',
    photoFolderId: p.PHOTO_FOLDER_ID || '',
    enabled: p.ACCEPTING === 'true',
    startAt: p.START_AT || '',
    endAt: p.END_AT || '',
    rulesVersion: p.RULES_VERSION || '',
    maxSubmissions: Number(p.MAX_SUBMISSIONS),
    privacy: {
      controller: p.PRIVACY_CONTROLLER || '',
      contact: p.PRIVACY_CONTACT || '',
      purpose: p.PRIVACY_PURPOSE || '',
      items: [
        '자가신고 회원번호',
        '이름',
        '휴대폰 번호',
        '응모 사연',
        '선택 첨부 사진',
        '동의 및 접수 기록',
      ],
      retentionDays: Number(p.PRIVACY_RETENTION_DAYS),
    },
  };
}

function validDate_(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) &&
    Number.isFinite(Date.parse(value))
  );
}

function configReady_(c) {
  return Boolean(
    c.spreadsheetId &&
    c.photoFolderId &&
    validDate_(c.startAt) &&
    validDate_(c.endAt) &&
    Date.parse(c.startAt) < Date.parse(c.endAt) &&
    c.rulesVersion.trim() &&
    c.privacy.controller.trim() &&
    c.privacy.contact.trim() &&
    c.privacy.purpose.trim() &&
    Number.isInteger(c.privacy.retentionDays) &&
    c.privacy.retentionDays >= 1 &&
    c.privacy.retentionDays <= 365 &&
    Number.isInteger(c.maxSubmissions) &&
    c.maxSubmissions >= 1 &&
    c.maxSubmissions <= 10000,
  );
}

function isAccepting_(c, now) {
  return (
    c.enabled &&
    configReady_(c) &&
    now >= Date.parse(c.startAt) &&
    now < Date.parse(c.endAt)
  );
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** 정책과 일정만 공개한다. 응모 내역 조회 API는 제공하지 않는다. */
function doGet() {
  const c = readConfig_();
  return json_({
    ok: true,
    eventId: EVENT_ID,
    schemaVersion: SCHEMA_VERSION,
    accepting: isAccepting_(c, Date.now()),
    startAt: c.startAt,
    endAt: c.endAt,
    rulesVersion: c.rulesVersion,
    privacy: c.privacy,
  });
}

function reject_(code) {
  throw new Error(code);
}
function string_(value, min, max) {
  if (
    typeof value !== 'string' ||
    value.trim().length < min ||
    value.trim().length > max ||
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)
  )
    reject_('INVALID_INPUT');
  return value.trim();
}

function parseInput_(event) {
  if (
    !event ||
    !event.postData ||
    typeof event.postData.contents !== 'string' ||
    event.postData.contents.length > MAX_BODY_BYTES ||
    Number(event.contentLength || 0) > MAX_BODY_BYTES
  )
    reject_('INVALID_INPUT');
  const raw = JSON.parse(event.postData.contents);
  if (
    !raw ||
    typeof raw !== 'object' ||
    Array.isArray(raw) ||
    raw.eventId !== EVENT_ID ||
    raw.schemaVersion !== SCHEMA_VERSION
  )
    reject_('WRONG_EVENT');
  const keys = [
    'eventId',
    'schemaVersion',
    'submissionId',
    'memberId',
    'name',
    'phone',
    'reason',
    'privacyConsent',
    'rulesConsent',
    'rulesVersion',
    'photos',
  ];
  if (
    Object.keys(raw).some(function (key) {
      return keys.indexOf(key) === -1;
    })
  )
    reject_('INVALID_INPUT');
  if (
    typeof raw.submissionId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      raw.submissionId,
    )
  )
    reject_('INVALID_INPUT');
  if (typeof raw.memberId !== 'string' || !/^[1-9]\d{0,18}$/.test(raw.memberId))
    reject_('INVALID_INPUT');
  if (raw.privacyConsent !== true || raw.rulesConsent !== true)
    reject_('CONSENT_REQUIRED');
  const phone = string_(raw.phone, 10, 20).replace(/[\s-]/g, '');
  if (!/^01(?:0\d{8}|[16789]\d{7,8})$/.test(phone)) reject_('INVALID_INPUT');
  const photos = raw.photos === undefined ? [] : raw.photos;
  if (!Array.isArray(photos) || photos.length > 3) reject_('INVALID_PHOTO');
  return {
    submissionId: raw.submissionId.toLowerCase(),
    memberId: raw.memberId,
    name: string_(raw.name, 1, 80),
    phone: phone,
    reason: string_(raw.reason, 10, 300),
    rulesVersion: string_(raw.rulesVersion, 1, 100),
    photos: photos.map(validatePhoto_),
  };
}

function validatePhoto_(photo) {
  if (
    !photo ||
    typeof photo !== 'object' ||
    Array.isArray(photo) ||
    Object.keys(photo).some(function (key) {
      return ['name', 'mimeType', 'data'].indexOf(key) === -1;
    })
  )
    reject_('INVALID_PHOTO');
  string_(photo.name, 1, 200);
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  if (
    !Object.prototype.hasOwnProperty.call(extensions, photo.mimeType) ||
    typeof photo.data !== 'string' ||
    !photo.data.length ||
    photo.data.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 ||
    photo.data.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(photo.data)
  )
    reject_('INVALID_PHOTO');
  const bytes = Utilities.base64Decode(photo.data);
  if (bytes.length < 12 || bytes.length > MAX_PHOTO_BYTES)
    reject_('INVALID_PHOTO');
  const at = function (i) {
    return bytes[i] & 255;
  };
  const jpeg = at(0) === 255 && at(1) === 216 && at(2) === 255;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(function (v, i) {
    return at(i) === v;
  });
  const webp =
    [82, 73, 70, 70].every(function (v, i) {
      return at(i) === v;
    }) &&
    [87, 69, 66, 80].every(function (v, i) {
      return at(i + 8) === v;
    });
  if (
    !(photo.mimeType === 'image/jpeg' && jpeg) &&
    !(photo.mimeType === 'image/png' && png) &&
    !(photo.mimeType === 'image/webp' && webp)
  )
    reject_('INVALID_PHOTO');
  return {
    bytes: bytes,
    mimeType: photo.mimeType,
    extension: extensions[photo.mimeType],
  };
}

function safeCell_(value) {
  const text = String(value);
  // 문자열 열은 텍스트 서식과 함께 수식 시작 문자도 이중으로 방어한다.
  return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
}

function fingerprint_(input) {
  const normalized = JSON.stringify({
    memberId: input.memberId,
    name: input.name,
    phone: input.phone,
    reason: input.reason,
    rulesVersion: input.rulesVersion,
    photos: input.photos.map(function (photo) {
      return {
        mimeType: photo.mimeType,
        data: Utilities.base64Encode(photo.bytes),
      };
    }),
  });
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    normalized,
    Utilities.Charset.UTF_8,
  )
    .map(function (byte) {
      return ('0' + (byte & 255).toString(16)).slice(-2);
    })
    .join('');
}

function sheet_(c) {
  const sheet = SpreadsheetApp.openById(c.spreadsheetId).getSheetByName('응모');
  if (
    !sheet ||
    JSON.stringify(sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0]) !==
      JSON.stringify(HEADERS)
  )
    reject_('STORAGE_NOT_READY');
  return sheet;
}

function doPost(event) {
  let lock;
  let locked = false;
  let rowWriteStarted = false;
  const createdFiles = [];
  try {
    const c = readConfig_();
    if (!isAccepting_(c, Date.now())) reject_('NOT_ACCEPTING');
    const input = parseInput_(event);
    if (input.rulesVersion !== c.rulesVersion) reject_('POLICY_CHANGED');
    const digest = fingerprint_(input);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) reject_('BUSY');
    locked = true;
    // 잠금을 기다리는 동안 운영자가 접수를 닫았거나 마감이 지났을 수 있다.
    const latest = readConfig_();
    if (
      !isAccepting_(latest, Date.now()) ||
      JSON.stringify(latest) !== JSON.stringify(c)
    )
      reject_('NOT_ACCEPTING');
    const sheet = sheet_(c);
    const rows =
      sheet.getLastRow() > 1
        ? sheet
            .getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length)
            .getValues()
        : [];
    const previous = rows.find(function (row) {
      return String(row[2]) === input.submissionId;
    });
    if (previous) {
      if (String(previous[11]) !== digest) reject_('SUBMISSION_CONFLICT');
      return json_({
        ok: true,
        eventId: EVENT_ID,
        submissionId: input.submissionId,
        receivedAt: String(previous[0]),
      });
    }
    if (rows.length >= c.maxSubmissions) reject_('CAPACITY_REACHED');
    const folder = DriveApp.getFolderById(c.photoFolderId);
    const spreadsheetFile = DriveApp.getFileById(c.spreadsheetId);
    if (
      folder.getSharingAccess() !== DriveApp.Access.PRIVATE ||
      spreadsheetFile.getSharingAccess() !== DriveApp.Access.PRIVATE
    )
      reject_('STORAGE_NOT_PRIVATE');
    input.photos.forEach(function (photo, i) {
      const file = folder.createFile(
        Utilities.newBlob(
          photo.bytes,
          photo.mimeType,
          input.submissionId + '-' + (i + 1) + '.' + photo.extension,
        ),
      );
      createdFiles.push(file);
      file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    });
    const receivedAt = new Date().toISOString();
    const deleteAt = new Date(
      Date.parse(receivedAt) + c.privacy.retentionDays * 86400000,
    ).toISOString();
    const row = [
      receivedAt,
      EVENT_ID,
      input.submissionId,
      input.memberId,
      input.name,
      input.phone,
      input.reason,
      'true',
      'true',
      c.rulesVersion,
      JSON.stringify(
        createdFiles.map(function (file) {
          return file.getId();
        }),
      ),
      digest,
      deleteAt,
      '미검증',
    ];
    // 시트 쓰기 중 오류가 나면 저장 여부가 모호하므로 사진을 먼저 지우지 않는다.
    rowWriteStarted = true;
    sheet
      .getRange(sheet.getLastRow() + 1, 1, 1, HEADERS.length)
      .setNumberFormat('@')
      .setValues([row.map(safeCell_)]);
    SpreadsheetApp.flush();
    return json_({
      ok: true,
      eventId: EVENT_ID,
      submissionId: input.submissionId,
      receivedAt: receivedAt,
    });
  } catch (error) {
    if (!rowWriteStarted)
      createdFiles.forEach(function (file) {
        try {
          file.setTrashed(true);
        } catch (_) {
          /* 운영자가 실패 파일 확인 */
        }
      });
    const allowed = [
      'NOT_ACCEPTING',
      'INVALID_INPUT',
      'WRONG_EVENT',
      'CONSENT_REQUIRED',
      'INVALID_PHOTO',
      'BUSY',
      'STORAGE_NOT_READY',
      'SUBMISSION_CONFLICT',
      'CAPACITY_REACHED',
      'STORAGE_NOT_PRIVATE',
      'POLICY_CHANGED',
    ];
    return json_({
      ok: false,
      code: allowed.indexOf(error.message) >= 0 ? error.message : 'UNAVAILABLE',
    });
  } finally {
    if (locked) lock.releaseLock();
  }
}

/** 보관기간 지난 행을 삭제하고 사진은 휴지통으로 옮긴다. 인자를 생략하면 대상 수만 확인한다. */
function cleanupExpiredEntries(dryRun) {
  const c = readConfig_();
  if (!configReady_(c)) throw new Error('운영 설정을 먼저 확인하세요.');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000))
    throw new Error('접수 처리 중입니다. 나중에 다시 실행하세요.');
  try {
    const sheet = sheet_(c);
    const rows =
      sheet.getLastRow() > 1
        ? sheet
            .getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length)
            .getValues()
        : [];
    let count = 0;
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      const row = rows[i];
      if (
        row[1] !== EVENT_ID ||
        !validDate_(String(row[12])) ||
        Date.parse(row[12]) > Date.now()
      )
        continue;
      count += 1;
      if (dryRun !== false) continue;
      const fileIds = JSON.parse(String(row[10]));
      if (!Array.isArray(fileIds))
        throw new Error('사진 기록 확인이 필요합니다.');
      fileIds.forEach(function (id) {
        const file = DriveApp.getFileById(String(id));
        const parents = file.getParents();
        let belongs = false;
        while (parents.hasNext())
          if (parents.next().getId() === c.photoFolderId) belongs = true;
        if (!belongs || file.getName().indexOf(String(row[2]) + '-') !== 0)
          throw new Error('사진 소유 경로 확인이 필요합니다.');
        file.setTrashed(true);
      });
      sheet.deleteRow(i + 2);
    }
    return { matchedEntries: count, dryRun: dryRun !== false };
  } finally {
    lock.releaseLock();
  }
}
