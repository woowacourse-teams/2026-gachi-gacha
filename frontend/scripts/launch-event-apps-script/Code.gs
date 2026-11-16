/* 가치가챠 앱 출시 이벤트 v3. 회원 검증 중계 서버가 서명한 요청만 접수한다. */
const EVENT_ID = 'app-launch-2026';
const SCHEMA_VERSION = 3;
const MAX_TRADE_IDS = 10000;
const MAX_BODY_BYTES = 256 * 1024;
const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;
const HEADERS = [
  '최초접수일시',
  '최종접수일시',
  '이벤트ID',
  '접수ID',
  '회원ID',
  '이름',
  '인스타그램ID',
  '교환글수',
  '교환글ID목록1',
  '교환글ID목록2',
  '교환글ID목록3',
  '교환글ID목록4',
  '교환글ID목록5',
  '개인정보동의',
  '유의사항동의',
  '약관버전',
  '요청해시',
  '삭제예정일',
  '운영검증상태',
  '접수횟수',
];
const RECEIPT_HEADERS = [
  '이벤트ID',
  '접수ID',
  '회원ID',
  '요청해시',
  '접수일시',
  '최초접수일시',
  '접수횟수',
  '삭제예정일',
];
const LEGACY_HEADERS = HEADERS.map(function (header) {
  return /^(회원ID|교환글수|교환글ID목록[1-5])$/.test(header)
    ? '자가신고' + header
    : header;
});
const LEGACY_RECEIPT_HEADERS = RECEIPT_HEADERS.map(function (header) {
  return header === '회원ID' ? '자가신고회원ID' : header;
});

/** 새 저장소만 만든다. 기존 시트·기존 이벤트 사진 폴더는 수정하지 않는다. */
function setupLaunchEventStorage() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('설정 작업 중입니다.');
  try {
    const properties = PropertiesService.getScriptProperties();
    if (
      properties.getProperty('SPREADSHEET_ID') ||
      properties.getProperty('PHOTO_FOLDER_ID')
    )
      throw new Error(
        '기존 저장소가 있습니다. 별도의 새 프로젝트를 사용하세요.',
      );
    const spreadsheet = SpreadsheetApp.create(
      '가치가챠 앱 출시 이벤트 v2 응모',
    );
    spreadsheet.setSpreadsheetTimeZone('Asia/Seoul');
    DriveApp.getFileById(spreadsheet.getId()).setSharing(
      DriveApp.Access.PRIVATE,
      DriveApp.Permission.NONE,
    );
    const sheet = spreadsheet.getSheets()[0];
    sheet.setName('응모');
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    const receipts = spreadsheet.insertSheet('접수이력');
    receipts
      .getRange(1, 1, 1, RECEIPT_HEADERS.length)
      .setValues([RECEIPT_HEADERS]);
    receipts.setFrozenRows(1);
    properties.setProperties({
      SPREADSHEET_ID: spreadsheet.getId(),
      ACCEPTING: 'false',
      EVENT_RELAY_SECRET: '',
      START_AT: '',
      END_AT: '',
      PRIVACY_CONTROLLER: '',
      PRIVACY_CONTACT: '',
      PRIVACY_PURPOSE: '',
      PRIVACY_RETENTION_DAYS: '',
      RULES_VERSION: '',
      MAX_SUBMISSIONS: '1000',
      MAX_RECEIPTS: '100000',
    });
    return { spreadsheetId: spreadsheet.getId(), accepting: false };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 직접 만든 기존 v2 시트에는 setup을 다시 실행하지 않는다.
 * 접수를 닫고 두 탭에 헤더만 남아 있을 때만 명시적으로 실행한다.
 * 기존 응모가 한 행이라도 있으면 미검증 데이터를 검증 완료로 바꾸지 않고 중단한다.
 */
function migrateEmptyLaunchEventStorageToVerified() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('설정 작업 중입니다.');
  try {
    const c = readConfig_();
    if (c.enabled || !c.spreadsheetId)
      throw new Error('접수를 중단하고 기존 스프레드시트 ID를 확인하세요.');
    if (
      DriveApp.getFileById(c.spreadsheetId).getSharingAccess() !==
      DriveApp.Access.PRIVATE
    )
      throw new Error('비공개 스프레드시트만 전환할 수 있습니다.');
    const spreadsheet = SpreadsheetApp.openById(c.spreadsheetId);
    const targets = [
      { name: '응모', headers: HEADERS, legacy: LEGACY_HEADERS },
      {
        name: '접수이력',
        headers: RECEIPT_HEADERS,
        legacy: LEGACY_RECEIPT_HEADERS,
      },
    ].map(function (target) {
      const sheet = spreadsheet.getSheetByName(target.name);
      if (
        !sheet ||
        sheet.getLastRow() !== 1 ||
        sheet.getLastColumn() !== target.headers.length
      )
        throw new Error(
          '두 탭 모두 기존 헤더만 있어야 합니다. 데이터는 변경하지 않았습니다.',
        );
      const current = JSON.stringify(
        sheet.getRange(1, 1, 1, target.headers.length).getValues()[0],
      );
      if (
        current !== JSON.stringify(target.headers) &&
        current !== JSON.stringify(target.legacy)
      )
        throw new Error(
          '예상한 헤더가 아닙니다. 데이터는 변경하지 않았습니다.',
        );
      return { sheet: sheet, headers: target.headers };
    });
    // 양쪽 탭을 모두 검사한 뒤에만 쓴다. 부분 오류 후 재실행도 헤더만 있는 경우에 한한다.
    targets.forEach(function (target) {
      target.sheet
        .getRange(1, 1, 1, target.headers.length)
        .setValues([target.headers]);
    });
    SpreadsheetApp.flush();
    return { schemaVersion: SCHEMA_VERSION, accepting: false };
  } finally {
    lock.releaseLock();
  }
}

function readConfig_() {
  const p = PropertiesService.getScriptProperties().getProperties();
  return {
    spreadsheetId: p.SPREADSHEET_ID || '',
    enabled: p.ACCEPTING === 'true',
    relaySecret: p.EVENT_RELAY_SECRET || '',
    startAt: p.START_AT || '',
    endAt: p.END_AT || '',
    rulesVersion: p.RULES_VERSION || '',
    maxSubmissions: Number(p.MAX_SUBMISSIONS),
    maxReceipts: Number(p.MAX_RECEIPTS),
    privacy: {
      controller: p.PRIVACY_CONTROLLER || '',
      contact: p.PRIVACY_CONTACT || '',
      purpose: p.PRIVACY_PURPOSE || '',
      items: [
        '로그인 회원번호',
        '이름',
        '인스타그램 ID',
        '서버에서 조회한 본인 교환글 수 및 ID 목록',
        '동의 및 접수 기록',
      ],
      retentionDays: Number(p.PRIVACY_RETENTION_DAYS),
    },
  };
}

function validDate_(value) {
  if (typeof value !== 'string') return false;
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{3})?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(
      value,
    );
  if (!parts) return false;
  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  return (
    year >= 2000 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= new Date(Date.UTC(year, month, 0)).getUTCDate() &&
    Number(parts[4]) <= 23 &&
    Number(parts[5]) <= 59 &&
    Number(parts[6]) <= 59 &&
    Number(parts[7] || 0) <= 23 &&
    Number(parts[8] || 0) <= 59 &&
    Number.isFinite(Date.parse(value))
  );
}

function configReady_(c) {
  return Boolean(
    c.spreadsheetId &&
    /^[0-9a-fA-F]{64}$/.test(c.relaySecret) &&
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
    c.maxSubmissions <= 10000 &&
    Number.isInteger(c.maxReceipts) &&
    c.maxReceipts >= 1 &&
    c.maxReceipts <= 100000,
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

/** 공개 응답에는 일정·개인정보 안내만 포함한다. 응모/영수증 조회 API는 없다. */
function doGet() {
  const c = readConfig_();
  let accepting = isAccepting_(c, Date.now());
  if (accepting) {
    try {
      storage_(c);
    } catch (_) {
      accepting = false;
    }
  }
  return json_({
    ok: true,
    eventId: EVENT_ID,
    schemaVersion: SCHEMA_VERSION,
    authentication: 'server-verified',
    accepting: accepting,
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
    /[\u0000-\u001F\u007F]/.test(value)
  )
    reject_('INVALID_INPUT');
  return value.trim();
}

function parseInput_(event, config) {
  if (
    !event ||
    !event.postData ||
    typeof event.postData.contents !== 'string' ||
    event.postData.contents.length > MAX_BODY_BYTES ||
    Number(event.contentLength || 0) > MAX_BODY_BYTES ||
    Utilities.newBlob(event.postData.contents).getBytes().length >
      MAX_BODY_BYTES
  )
    reject_('INVALID_INPUT');
  let envelope;
  try {
    envelope = JSON.parse(event.postData.contents);
  } catch (_) {
    reject_('INVALID_INPUT');
  }
  if (
    !envelope ||
    typeof envelope !== 'object' ||
    Array.isArray(envelope) ||
    Object.keys(envelope).length !== 3 ||
    typeof envelope.payload !== 'string' ||
    envelope.payload.length > MAX_BODY_BYTES ||
    !Number.isSafeInteger(envelope.timestamp) ||
    Math.abs(Date.now() - envelope.timestamp) > SIGNATURE_MAX_AGE_MS ||
    typeof envelope.signature !== 'string' ||
    !/^[0-9a-f]{64}$/.test(envelope.signature) ||
    !/^[0-9a-fA-F]{64}$/.test(config.relaySecret)
  )
    reject_('AUTH_REQUIRED');
  // 키는 64자리 hex 문자열 자체를 UTF-8로 사용한다. hex를 바이트로 디코딩하지 않는다.
  const signature = Utilities.computeHmacSha256Signature(
    String(envelope.timestamp) + '\n' + envelope.payload,
    config.relaySecret,
    Utilities.Charset.UTF_8,
  )
    .map(function (byte) {
      return ('0' + (byte & 255).toString(16)).slice(-2);
    })
    .join('');
  let difference = 0;
  for (let i = 0; i < 64; i += 1)
    difference |= signature.charCodeAt(i) ^ envelope.signature.charCodeAt(i);
  if (difference !== 0) reject_('AUTH_REQUIRED');
  let raw;
  try {
    raw = JSON.parse(envelope.payload);
  } catch (_) {
    reject_('INVALID_INPUT');
  }
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
    'instagramId',
    'tradeIds',
    'privacyConsent',
    'rulesConsent',
    'rulesVersion',
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
    ) ||
    typeof raw.memberId !== 'string' ||
    !/^[1-9]\d{0,18}$/.test(raw.memberId) ||
    typeof raw.instagramId !== 'string' ||
    !/^[a-z0-9._]{1,30}$/.test(raw.instagramId) ||
    !Array.isArray(raw.tradeIds) ||
    raw.tradeIds.length === 0 ||
    raw.tradeIds.length > MAX_TRADE_IDS ||
    raw.tradeIds.some(function (id) {
      return !Number.isSafeInteger(id) || id < 1;
    }) ||
    new Set(raw.tradeIds).size !== raw.tradeIds.length
  )
    reject_('INVALID_INPUT');
  if (raw.privacyConsent !== true || raw.rulesConsent !== true)
    reject_('CONSENT_REQUIRED');
  return {
    submissionId: raw.submissionId.toLowerCase(),
    memberId: raw.memberId,
    name: string_(raw.name, 1, 80),
    instagramId: raw.instagramId,
    tradeIds: raw.tradeIds.slice().sort(function (a, b) {
      return a - b;
    }),
    rulesVersion: string_(raw.rulesVersion, 1, 100),
  };
}

function safeCell_(value) {
  const text = String(value);
  return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
}

function fingerprint_(input) {
  const normalized = JSON.stringify({
    eventId: EVENT_ID,
    schemaVersion: SCHEMA_VERSION,
    memberId: input.memberId,
    name: input.name,
    instagramId: input.instagramId,
    tradeIds: input.tradeIds,
    privacyConsent: true,
    rulesConsent: true,
    rulesVersion: input.rulesVersion,
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

function checkedSheet_(spreadsheet, name, headers) {
  const sheet = spreadsheet.getSheetByName(name);
  if (
    !sheet ||
    sheet.getLastColumn() !== headers.length ||
    JSON.stringify(sheet.getRange(1, 1, 1, headers.length).getValues()[0]) !==
      JSON.stringify(headers)
  )
    reject_('STORAGE_NOT_READY');
  return sheet;
}

function storage_(c) {
  // Drive는 스프레드시트 공개 여부 확인에만 사용하며 첨부 파일은 저장하지 않는다.
  if (
    DriveApp.getFileById(c.spreadsheetId).getSharingAccess() !==
    DriveApp.Access.PRIVATE
  )
    reject_('STORAGE_NOT_PRIVATE');
  const spreadsheet = SpreadsheetApp.openById(c.spreadsheetId);
  return {
    sheet: checkedSheet_(spreadsheet, '응모', HEADERS),
    receipts: checkedSheet_(spreadsheet, '접수이력', RECEIPT_HEADERS),
  };
}

function rows_(sheet, width) {
  return sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues()
    : [];
}

function writeRow_(sheet, rowNumber, row) {
  const maxRows = sheet.getMaxRows();
  if (rowNumber > maxRows)
    sheet.insertRowsAfter(maxRows, Math.max(100, rowNumber - maxRows));
  sheet
    .getRange(rowNumber, 1, 1, row.length)
    .setNumberFormat('@')
    .setValues([row.map(safeCell_)]);
  SpreadsheetApp.flush();
}

function receipt_(record) {
  return json_({
    ok: true,
    eventId: EVENT_ID,
    submissionId: String(record[1]),
    receivedAt: String(record[4]),
  });
}

function applyEntry_(sheet, rowNumber, input, record) {
  // 2,000개씩 나눠 안전정수 10,000개도 셀당 50,000자 제한 안에 보관한다.
  const chunks = [];
  for (let i = 0; i < 5; i += 1)
    chunks.push(JSON.stringify(input.tradeIds.slice(i * 2000, (i + 1) * 2000)));
  writeRow_(
    sheet,
    rowNumber,
    [
      record[5],
      record[4],
      EVENT_ID,
      input.submissionId,
      input.memberId,
      input.name,
      input.instagramId,
      input.tradeIds.length,
    ].concat(chunks, [
      'true',
      'true',
      input.rulesVersion,
      record[3],
      record[7],
      '로그인·게시글 확인 / 앱 설치 확인 필요',
      record[6],
    ]),
  );
}

function doPost(event) {
  let lock;
  let locked = false;
  try {
    const signedConfig = readConfig_();
    const input = parseInput_(event, signedConfig);
    const digest = fingerprint_(input);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) reject_('BUSY');
    locked = true;
    const c = readConfig_();
    // 잠금 대기 사이 비밀키가 교체되면 이전 키로 검증한 요청은 접수하지 않는다.
    if (c.relaySecret !== signedConfig.relaySecret) reject_('AUTH_REQUIRED');
    if (!configReady_(c)) reject_('NOT_ACCEPTING');
    const storage = storage_(c);
    const entries = rows_(storage.sheet, HEADERS.length);
    const records = rows_(storage.receipts, RECEIPT_HEADERS.length);
    const matching = entries
      .map(function (row, index) {
        return { row: row, index: index };
      })
      .filter(function (entry) {
        return (
          entry.row[2] === EVENT_ID && String(entry.row[4]) === input.memberId
        );
      });
    if (matching.length > 1) reject_('STORAGE_NOT_READY');
    const entry = matching[0];
    const rowNumber = entry ? entry.index + 2 : storage.sheet.getLastRow() + 1;
    const memberRecords = records.filter(function (row) {
      return row[0] === EVENT_ID && String(row[2]) === input.memberId;
    });
    // 운영자가 시트 정렬을 바꿔도 물리 행 순서가 아닌 접수 횟수로 최신 요청을 찾는다.
    const lastRecord = memberRecords.reduce(function (latestRecord, record) {
      const revision = Number(record[6]);
      if (
        !Number.isSafeInteger(revision) ||
        revision < 1 ||
        !validDate_(String(record[4])) ||
        !validDate_(String(record[5]))
      )
        reject_('STORAGE_NOT_READY');
      return !latestRecord || revision > Number(latestRecord[6])
        ? record
        : latestRecord;
    }, undefined);
    const previous = records.filter(function (row) {
      return String(row[1]) === input.submissionId;
    });
    if (previous.length > 1 || (entry && !lastRecord))
      reject_('STORAGE_NOT_READY');
    if (previous.length) {
      const record = previous[0];
      if (
        record[0] !== EVENT_ID ||
        String(record[2]) !== input.memberId ||
        String(record[3]) !== digest
      )
        reject_('SUBMISSION_CONFLICT');
      if (!validDate_(String(record[7]))) reject_('STORAGE_NOT_READY');
      if (Date.now() >= Date.parse(record[7])) reject_('NOT_ACCEPTING');
      // 이미 기록된 요청의 동일 재시도는 종료·접수 중단·약관 변경 뒤에도
      // 원래 보관기한 안에서만 확인/복구한다. 새 UUID에는 적용하지 않는다.
      // 최신 UUID만 중단된 쓰기를 복구한다. 과거 재시도는 영수증만 반환한다.
      if (
        lastRecord[1] === input.submissionId &&
        (!entry || String(entry.row[3]) !== input.submissionId)
      )
        applyEntry_(storage.sheet, rowNumber, input, record);
      return receipt_(record);
    }
    if (!isAccepting_(c, Date.now())) reject_('NOT_ACCEPTING');
    if (input.rulesVersion !== c.rulesVersion) reject_('POLICY_CHANGED');
    const members = new Set();
    entries.forEach(function (row) {
      if (row[2] === EVENT_ID) members.add(String(row[4]));
    });
    records.forEach(function (row) {
      if (row[0] === EVENT_ID) members.add(String(row[2]));
    });
    if (!members.has(input.memberId) && members.size >= c.maxSubmissions)
      reject_('CAPACITY_REACHED');
    // 진행 중 이력을 축출하면 과거 UUID가 새 응모로 되살아나므로 상한에서 거절한다.
    if (records.length >= c.maxReceipts) reject_('RECEIPT_CAPACITY_REACHED');
    const receivedAt = new Date().toISOString();
    const deleteAt = new Date(
      Date.parse(c.endAt) + c.privacy.retentionDays * 86400000,
    ).toISOString();
    const record = [
      EVENT_ID,
      input.submissionId,
      input.memberId,
      digest,
      receivedAt,
      lastRecord ? lastRecord[5] : receivedAt,
      lastRecord ? Number(lastRecord[6]) + 1 : 1,
      deleteAt,
    ];
    // UUID를 먼저 보존해야 시트 쓰기 실패·응답 유실 후에도 중복/과거 요청을 구분한다.
    writeRow_(storage.receipts, storage.receipts.getLastRow() + 1, record);
    applyEntry_(storage.sheet, rowNumber, input, record);
    return receipt_(record);
  } catch (error) {
    const allowed = [
      'NOT_ACCEPTING',
      'AUTH_REQUIRED',
      'INVALID_INPUT',
      'WRONG_EVENT',
      'CONSENT_REQUIRED',
      'BUSY',
      'STORAGE_NOT_READY',
      'SUBMISSION_CONFLICT',
      'CAPACITY_REACHED',
      'RECEIPT_CAPACITY_REACHED',
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

/** 기본은 조회. false를 명시한 경우 종료 후 보관기한이 지난 해당 이벤트 행만 삭제한다. */
function cleanupExpiredEntries(dryRun) {
  const c = readConfig_();
  if (!configReady_(c)) throw new Error('운영 설정을 먼저 확인하세요.');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000))
    throw new Error('접수 처리 중입니다. 나중에 다시 실행하세요.');
  try {
    const storage = storage_(c);
    let matchedEntries = 0;
    let matchedReceipts = 0;
    // 접수 기간 중에는 UUID 이력을 지우지 않는다.
    if (Date.now() < Date.parse(c.endAt))
      return {
        matchedEntries: 0,
        matchedReceipts: 0,
        dryRun: dryRun !== false,
      };
    [
      {
        sheet: storage.sheet,
        width: HEADERS.length,
        eventColumn: 2,
        expiryColumn: 17,
      },
      {
        sheet: storage.receipts,
        width: RECEIPT_HEADERS.length,
        eventColumn: 0,
        expiryColumn: 7,
      },
    ].forEach(function (target, targetIndex) {
      const rows = rows_(target.sheet, target.width);
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        const row = rows[i];
        const expiry = String(row[target.expiryColumn]);
        if (
          row[target.eventColumn] !== EVENT_ID ||
          !validDate_(expiry) ||
          Date.parse(expiry) > Date.now()
        )
          continue;
        if (targetIndex === 0) matchedEntries += 1;
        else matchedReceipts += 1;
        if (dryRun === false) target.sheet.deleteRow(i + 2);
      }
    });
    return {
      matchedEntries: matchedEntries,
      matchedReceipts: matchedReceipts,
      dryRun: dryRun !== false,
    };
  } finally {
    lock.releaseLock();
  }
}
