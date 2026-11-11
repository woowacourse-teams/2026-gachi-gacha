import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
const baseInput = {
  eventId: 'app-launch-2026',
  schemaVersion: 1,
  submissionId: '019ab251-394e-4a77-9c21-1221ea123456',
  memberId: '17',
  name: '테스트',
  phone: '010-1234-5678',
  reason: '앱 출시를 축하하는 테스트입니다.',
  privacyConsent: true,
  rulesConsent: true,
  rulesVersion: 'test-policy-v1',
  photos: [],
};

function harness() {
  const properties = {
    SPREADSHEET_ID: 'private-sheet',
    PHOTO_FOLDER_ID: 'private-folder',
    ACCEPTING: 'true',
    START_AT: '2020-01-01T00:00:00Z',
    END_AT: '2099-01-01T00:00:00Z',
    RULES_VERSION: 'test-policy-v1',
    PRIVACY_CONTROLLER: '테스트 운영자',
    PRIVACY_CONTACT: 'test@example.com',
    PRIVACY_PURPOSE: '테스트 접수 및 연락',
    PRIVACY_RETENTION_DAYS: '30',
    MAX_SUBMISSIONS: '1000',
  };
  const rows = [];
  const files = [];
  let lockAvailable = true;
  let folderPrivate = true;
  let sheetPrivate = true;
  const sheet = {
    getLastRow: () => rows.length,
    getRange: (row, column, count) => ({
      getValues: () => rows.slice(row - 1, row - 1 + count),
      setNumberFormat() {
        return this;
      },
      setValues(values) {
        values.forEach((value, i) => {
          rows[row - 1 + i] = value;
        });
        return this;
      },
    }),
    deleteRow: (row) => rows.splice(row - 1, 1),
  };
  const folder = {
    getSharingAccess: () => (folderPrivate ? 'PRIVATE' : 'ANYONE'),
    createFile(blob) {
      const file = {
        getId: () => `photo-${files.length}`,
        getName: () => blob.name,
        setSharing() {
          return this;
        },
        setTrashed(value) {
          this.trashed = value;
        },
      };
      files.push(file);
      return file;
    },
  };
  const context = vm.createContext({
    PropertiesService: {
      getScriptProperties: () => ({ getProperties: () => properties }),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }),
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => lockAvailable, releaseLock() {} }),
    },
    SpreadsheetApp: {
      openById: () => ({ getSheetByName: () => sheet }),
      flush() {},
    },
    DriveApp: {
      Access: { PRIVATE: 'PRIVATE' },
      Permission: { NONE: 'NONE' },
      getFolderById: () => folder,
      getFileById: () => ({
        getSharingAccess: () => (sheetPrivate ? 'PRIVATE' : 'ANYONE'),
      }),
    },
    Utilities: {
      base64Decode: (data) => Array.from(Buffer.from(data, 'base64')),
      base64Encode: (bytes) => Buffer.from(bytes).toString('base64'),
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (_, data) =>
        Array.from(createHash('sha256').update(data).digest()),
      newBlob: (bytes, mimeType, name) => ({ bytes, mimeType, name }),
    },
  });
  vm.runInContext(source, context);
  rows.push(vm.runInContext('HEADERS.slice()', context));
  return {
    context,
    properties,
    rows,
    files,
    setLockAvailable: (value) => {
      lockAvailable = value;
    },
    setFolderPrivate: (value) => {
      folderPrivate = value;
    },
    setSheetPrivate: (value) => {
      sheetPrivate = value;
    },
    post: (input = baseInput) =>
      context.doPost({ postData: { contents: JSON.stringify(input) } }),
  };
}

test('접수와 같은 UUID 재시도는 한 행 및 동일 영수증을 반환한다', () => {
  const h = harness();
  const first = h.post();
  assert.equal(first.ok, true);
  assert.equal(first.submissionId, baseInput.submissionId);
  assert.deepEqual(h.post(), first);
  assert.equal(h.rows.length, 2);
  assert.equal(h.rows[1][5], '01012345678');
  assert.equal(h.rows[1][13], '미검증');
  assert.equal(
    h.post({ ...baseInput, name: '바뀐 이름' }).code,
    'SUBMISSION_CONFLICT',
  );
  assert.equal(h.rows.length, 2);
});

test('동의·정책·신규 계약과 허용 필드를 서버가 검증한다', () => {
  const h = harness();
  assert.equal(
    h.post({ ...baseInput, privacyConsent: false }).code,
    'CONSENT_REQUIRED',
  );
  assert.equal(
    h.post({ ...baseInput, rulesVersion: 'old-policy' }).code,
    'POLICY_CHANGED',
  );
  assert.equal(
    h.post({ ...baseInput, eventId: 'old-event' }).code,
    'WRONG_EVENT',
  );
  assert.equal(
    h.post({ ...baseInput, accessToken: 'do-not-send' }).code,
    'INVALID_INPUT',
  );
  assert.equal(h.post({ ...baseInput, reason: '짧음' }).code, 'INVALID_INPUT');
  assert.equal(h.rows.length, 1);
});

test('설정 미완료·기간 외·접수 중지는 모두 실패하며 정책만 공개한다', () => {
  const h = harness();
  assert.equal(h.context.doGet().accepting, true);
  h.properties.PRIVACY_CONTROLLER = '';
  assert.equal(h.post().code, 'NOT_ACCEPTING');
  assert.equal(h.context.doGet().accepting, false);
  h.properties.PRIVACY_CONTROLLER = '운영자';
  h.properties.END_AT = '2020-01-02T00:00:00Z';
  assert.equal(h.post().code, 'NOT_ACCEPTING');
  h.properties.END_AT = '2099-01-01T00:00:00Z';
  h.properties.ACCEPTING = 'false';
  assert.equal(h.post().code, 'NOT_ACCEPTING');
  assert.equal(h.context.doGet().entries, undefined);
  assert.equal(h.context.doGet().spreadsheetId, undefined);
});

test('수식 시작 입력은 시트 수식으로 실행되지 않게 저장한다', () => {
  const h = harness();
  assert.equal(
    h.post({ ...baseInput, name: '=1+1', reason: '+formula test payload' }).ok,
    true,
  );
  assert.equal(h.rows[1][4], "'=1+1");
  assert.equal(h.rows[1][6], "'+formula test payload");
});

test('사진은 형식·수량·크기를 검증하고 비공개 폴더만 사용한다', () => {
  const h = harness();
  const png = {
    name: 'test.png',
    mimeType: 'image/png',
    data: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]).toString(
      'base64',
    ),
  };
  assert.equal(
    h.post({ ...baseInput, photos: [png, png, png, png] }).code,
    'INVALID_PHOTO',
  );
  assert.equal(
    h.post({ ...baseInput, photos: [{ ...png, data: '%%%%' }] }).code,
    'INVALID_PHOTO',
  );
  assert.equal(
    h.post({ ...baseInput, photos: [{ ...png, mimeType: 'image/jpeg' }] }).code,
    'INVALID_PHOTO',
  );
  assert.equal(
    h.post({ ...baseInput, photos: [{ ...png, data: 'A'.repeat(7_000_000) }] })
      .code,
    'INVALID_PHOTO',
  );
  h.setFolderPrivate(false);
  assert.equal(
    h.post({ ...baseInput, photos: [png] }).code,
    'STORAGE_NOT_PRIVATE',
  );
  h.setFolderPrivate(true);
  h.setSheetPrivate(false);
  assert.equal(
    h.post({ ...baseInput, photos: [png] }).code,
    'STORAGE_NOT_PRIVATE',
  );
  h.setSheetPrivate(true);
  assert.equal(h.post({ ...baseInput, photos: [png] }).ok, true);
  assert.equal(h.files.length, 1);
  assert.ok(h.files[0].getName().startsWith(baseInput.submissionId));
  assert.ok(!h.rows[1][10].includes('http'));
});

test('동시 처리 잠금·접수 용량에 걸리면 기록하지 않는다', () => {
  const h = harness();
  h.setLockAvailable(false);
  assert.equal(h.post().code, 'BUSY');
  h.setLockAvailable(true);
  h.properties.MAX_SUBMISSIONS = '1';
  assert.equal(h.post().ok, true);
  assert.equal(
    h.post({
      ...baseInput,
      submissionId: '119ab251-394e-4a77-9c21-1221ea123456',
    }).code,
    'CAPACITY_REACHED',
  );
  assert.equal(h.rows.length, 2);
});

test('보관기간 정리는 기본적으로 조회만 하며 명시적 실행에서만 행을 지운다', () => {
  const h = harness();
  h.post();
  h.rows[1][12] = '2020-01-01T00:00:00Z';
  assert.equal(h.context.cleanupExpiredEntries().matchedEntries, 1);
  assert.equal(h.rows.length, 2);
  assert.equal(h.context.cleanupExpiredEntries(false).matchedEntries, 1);
  assert.equal(h.rows.length, 1);
});
