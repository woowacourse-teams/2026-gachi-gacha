import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
const baseInput = {
  eventId: 'app-launch-2026',
  schemaVersion: 4,
  submissionId: '019ab251-394e-4a77-9c21-1221ea123456',
  memberId: '17',
  name: '테스트',
  instagramId: 'gachi.test_17',
  tradeIds: [31, 12],
  privacyConsent: true,
  rulesConsent: true,
  rulesVersion: 'test-policy-v2',
};
const nextId = '119ab251-394e-4a77-9c21-1221ea123456';
const thirdId = '219ab251-394e-4a77-9c21-1221ea123456';
function harness() {
  const properties = {
    SPREADSHEET_ID: 'private-sheet',
    ACCEPTING: 'true',
    START_AT: '2026-11-01T00:00:00Z',
    END_AT: '2026-12-01T00:00:00Z',
    RULES_VERSION: 'test-policy-v2',
    PRIVACY_CONTROLLER: '테스트 운영자',
    PRIVACY_CONTACT: 'test@example.com',
    PRIVACY_PURPOSE: '응모 및 당첨자 안내',
    PRIVACY_RETENTION_DAYS: '30',
    MAX_SUBMISSIONS: '1000',
    MAX_RECEIPTS: '100000',
  };
  let now = Date.parse('2026-11-16T12:00:00Z');
  let lockAvailable = true;
  let onLock = () => {};
  let lockReleases = 0;
  let sheetPrivate = true;
  let failure;
  let created = 0;
  let flushFailure = false;
  const books = new Map();
  const formats = [];
  function makeBook(id, initialName) {
    const sheets = new Map();
    const book = {
      id,
      getId: () => id,
      setSpreadsheetTimeZone(value) {
        this.timezone = value;
      },
      getSheets: () => [...sheets.values()],
      getSheetByName: (name) => sheets.get(name),
      insertSheet: (name) => {
        const rows = [];
        const sheet = {
          rows,
          name,
          maxRows: 1000,
          addedRows: 0,
          setName(next) {
            sheets.delete(this.name);
            this.name = next;
            sheets.set(next, this);
          },
          setFrozenRows(value) {
            this.frozenRows = value;
          },
          getLastRow: () => rows.length,
          getLastColumn: () => Math.max(0, ...rows.map((row) => row.length)),
          getMaxRows() {
            return this.maxRows;
          },
          insertRowsAfter(position, count) {
            assert.equal(position, this.maxRows);
            assert.ok(Number.isSafeInteger(count) && count > 0);
            this.maxRows += count;
            this.addedRows += count;
          },
          getRange: (row, column, count, width) => {
            if (row < 1 || row + count - 1 > sheet.maxRows)
              throw new Error('Range exceeds sheet row limit');
            return {
              getValues: () =>
                Array.from({ length: count }, (_, i) =>
                  Array.from(
                    { length: width },
                    (_, j) => rows[row - 1 + i]?.[column - 1 + j] ?? '',
                  ),
                ),
              setNumberFormat(value) {
                formats.push(value);
                return this;
              },
              setValues(values) {
                const fail =
                  failure?.sheet === sheet.name ? failure : undefined;
                if (fail) failure = undefined;
                if (fail?.when === 'before')
                  throw new Error('secret-token: write failed');
                values.forEach((value, i) => {
                  rows[row - 1 + i] = Array.from(value);
                });
                if (fail?.when === 'after')
                  throw new Error('secret-token: response lost');
                return this;
              },
            };
          },
          deleteRow: (row) => rows.splice(row - 1, 1),
        };
        sheets.set(name, sheet);
        return sheet;
      },
    };
    if (initialName) book.insertSheet(initialName);
    books.set(id, book);
    return book;
  }
  const book = makeBook('private-sheet', '응모');
  book.insertSheet('접수이력');
  class Clock extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
    static now() {
      return now;
    }
  }
  const context = vm.createContext({
    Date: Clock,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => ({ ...properties }),
        getProperty: (key) => properties[key] ?? null,
        setProperties: (next) => Object.assign(properties, next),
      }),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }),
    },
    LockService: {
      getScriptLock: () => ({
        tryLock() {
          if (lockAvailable) onLock();
          return lockAvailable;
        },
        releaseLock() {
          lockReleases += 1;
        },
      }),
    },
    SpreadsheetApp: {
      openById: (id) => {
        if (!books.has(id)) throw new Error('secret-storage-id');
        return books.get(id);
      },
      create: () => {
        created += 1;
        return makeBook(`new-${created}`, 'Sheet1');
      },
      flush() {
        if (flushFailure) {
          flushFailure = false;
          throw new Error('secret-flush-token');
        }
      },
    },
    DriveApp: {
      Access: { PRIVATE: 'PRIVATE' },
      Permission: { NONE: 'NONE' },
      getFileById: () => ({
        getSharingAccess: () => (sheetPrivate ? 'PRIVATE' : 'ANYONE'),
        setSharing(access, permission) {
          assert.equal(access, 'PRIVATE');
          assert.equal(permission, 'NONE');
          sheetPrivate = true;
        },
      }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (_, data) =>
        Array.from(createHash('sha256').update(data).digest()),
      newBlob: (data) => ({
        getBytes: () => Array.from(Buffer.from(data, 'utf8')),
      }),
    },
  });
  vm.runInContext(source, context);
  book
    .getSheetByName('응모')
    .rows.push(Array.from(vm.runInContext('HEADERS', context)));
  book
    .getSheetByName('접수이력')
    .rows.push(Array.from(vm.runInContext('RECEIPT_HEADERS', context)));
  return {
    context,
    properties,
    formats,
    books,
    rows: book.getSheetByName('응모').rows,
    receipts: book.getSheetByName('접수이력').rows,
    setNow: (value) => {
      now = Date.parse(value);
    },
    setLockAvailable: (value) => {
      lockAvailable = value;
    },
    setOnLock: (fn) => {
      onLock = fn;
    },
    setSheetPrivate: (value) => {
      sheetPrivate = value;
    },
    failWrite: (sheet, when = 'before') => {
      failure = { sheet, when };
    },
    failFlush: () => {
      flushFailure = true;
    },
    lockReleases: () => lockReleases,
    created: () => created,
    post: (input = baseInput) =>
      context.doPost({
        postData: {
          type: 'text/plain;charset=UTF-8',
          contents: JSON.stringify(input),
        },
      }),
  };
}

test('브라우저 직접 전달 v4 본문은 비밀키 없이 실제 GAS에 저장되고 정상 영수증을 반환한다', () => {
  const h = harness();
  const metadata = h.context.doGet();
  assert.equal(metadata.schemaVersion, 4);
  assert.equal(metadata.authentication, 'client-reported');
  assert.equal(metadata.accepting, true);
  assert.equal('EVENT_RELAY_SECRET' in h.properties, false);
  const tradeIds = Array.from({ length: 103 }, (_, index) => index + 1);
  const input = { ...baseInput, tradeIds };
  const first = h.post(input);
  assert.deepEqual(first, {
    ok: true,
    eventId: baseInput.eventId,
    submissionId: baseInput.submissionId,
    receivedAt: '2026-11-16T12:00:00.000Z',
  });
  assert.deepEqual(h.post(input), first);
  assert.equal(h.rows.length, 2);
  assert.equal(h.receipts.length, 2);
  assert.equal(h.rows[1][4], '17');
  assert.equal(h.rows[1][6], 'gachi.test_17');
  assert.equal(h.rows[1][7], '103');
  assert.deepEqual(JSON.parse(h.rows[1][8]), tradeIds);
  assert.equal(h.rows[1][18], '브라우저 전달 / 참여 조건 확인 필요');
  assert.equal(h.rows[1][19], '1');
});

test('최초 접수는 전달값·동의·이벤트 종료 후 삭제일을 저장하고 같은 UUID는 같은 영수증을 반환한다', () => {
  const h = harness();
  const first = h.post();
  assert.deepEqual(first, {
    ok: true,
    eventId: baseInput.eventId,
    submissionId: baseInput.submissionId,
    receivedAt: '2026-11-16T12:00:00.000Z',
  });
  assert.deepEqual(h.post(), first);
  assert.deepEqual(h.post({ ...baseInput, tradeIds: [12, 31] }), first);
  assert.equal(h.rows.length, 2);
  assert.equal(h.receipts.length, 2);
  assert.equal(h.rows[1][4], '17');
  assert.equal(h.rows[1][6], 'gachi.test_17');
  assert.equal(h.rows[1][7], '2');
  assert.equal(h.rows[1][8], '[12,31]');
  assert.deepEqual(h.rows[1].slice(13, 16), ['true', 'true', 'test-policy-v2']);
  assert.match(h.rows[1][16], /^[a-f0-9]{64}$/);
  assert.equal(h.rows[1][17], '2026-12-31T00:00:00.000Z');
  assert.equal(h.rows[1][18], '브라우저 전달 / 참여 조건 확인 필요');
  assert.equal(h.rows[1][19], '1');
});

test('기존 v1·v2·v3 본문과 v3 서명 요청은 저장소 접근 전에 거절한다', () => {
  const h = harness();
  h.properties.SPREADSHEET_ID = 'unreachable-storage';
  const payload = JSON.stringify({ ...baseInput, schemaVersion: 3 });
  const timestamp = Date.parse('2026-11-16T12:00:00Z');
  const signature = createHmac('sha256', 'a1'.repeat(32))
    .update(timestamp + '\n' + payload, 'utf8')
    .digest('hex');
  for (const input of [
    { ...baseInput, schemaVersion: 1 },
    { ...baseInput, schemaVersion: 2 },
    { ...baseInput, schemaVersion: 3 },
    { payload, timestamp, signature },
    {},
    null,
    [],
  ]) {
    assert.deepEqual(h.post(input), { ok: false, code: 'WRONG_EVENT' });
  }
  assert.equal(h.lockReleases(), 0);
  assert.equal(h.rows.length, 1);
  assert.equal(h.receipts.length, 1);
});

test('회원·게시글 소유권은 검증하지 않으며 전달한 ID를 검증 완료로 표시하지 않는다', () => {
  const h = harness();
  const input = { ...baseInput, memberId: '999', tradeIds: [987654] };
  assert.equal(h.post(input).ok, true);
  assert.equal(h.rows[1][4], '999');
  assert.equal(h.rows[1][8], '[987654]');
  assert.equal(h.rows[1][18], '브라우저 전달 / 참여 조건 확인 필요');
  assert.equal(h.context.doGet().authentication, 'client-reported');
});

test('남아 있는 중계 비밀키는 사용·공개하지 않고 속성 변경은 다음 GET에 반영한다', () => {
  const h = harness();
  const leftoverSecret = 'unused-secret-must-not-be-exposed';
  h.properties.EVENT_RELAY_SECRET = leftoverSecret;
  assert.equal(h.context.doGet().accepting, true);
  assert.equal(h.post().ok, true);
  assert.ok(!JSON.stringify(h.context.doGet()).includes(leftoverSecret));
  assert.ok(!Object.hasOwn(h.context.doGet(), 'relaySecret'));
  h.properties.PRIVACY_CONTACT = 'new-contact@example.com';
  assert.equal(h.context.doGet().privacy.contact, 'new-contact@example.com');
  h.properties.ACCEPTING = 'false';
  assert.equal(h.context.doGet().accepting, false);
});

test('같은 회원의 새 UUID는 최신 1행을 갱신하고 검증 상태를 초기화하며 과거 재시도는 덮어쓰지 않는다', () => {
  const h = harness();
  const first = h.post();
  h.rows[1][18] = '운영자 확인 완료';
  h.setNow('2026-11-17T12:00:00Z');
  const updated = {
    ...baseInput,
    submissionId: nextId,
    name: '새 이름',
    instagramId: 'new.id',
    tradeIds: [43],
  };
  const second = h.post(updated);
  assert.equal(second.ok, true);
  assert.equal(h.rows.length, 2);
  assert.equal(h.receipts.length, 3);
  assert.equal(h.rows[1][0], first.receivedAt);
  assert.equal(h.rows[1][1], second.receivedAt);
  assert.equal(h.rows[1][5], '새 이름');
  assert.equal(h.rows[1][7], '1');
  assert.equal(h.rows[1][8], '[43]');
  assert.equal(h.rows[1][18], '브라우저 전달 / 참여 조건 확인 필요');
  assert.equal(h.rows[1][19], '2');
  h.rows[1][18] = '다시 확인 완료';
  const snapshot = JSON.stringify(h.rows);
  assert.deepEqual(h.post(), first);
  assert.deepEqual(h.post(updated), second);
  assert.equal(JSON.stringify(h.rows), snapshot);
});

test('같은 UUID로 내용·회원이 바뀌면 거절하고 다른 회원은 별도의 행을 쓴다', () => {
  const h = harness();
  h.post();
  for (const change of [
    { name: '변경' },
    { memberId: '18' },
    { tradeIds: [99] },
    { instagramId: 'changed' },
  ]) {
    assert.equal(
      h.post({ ...baseInput, ...change }).code,
      'SUBMISSION_CONFLICT',
    );
  }
  assert.equal(
    h.post({ ...baseInput, submissionId: nextId, memberId: '18' }).ok,
    true,
  );
  assert.equal(h.rows.length, 3);
  assert.equal(h.rows[1][4], '17');
  assert.equal(h.rows[2][4], '18');
});

test('운영자가 접수이력 행 순서를 바꿔도 과거 재시도는 최신 접수를 덮어쓰지 않는다', () => {
  const h = harness();
  const first = h.post();
  h.post({ ...baseInput, submissionId: nextId, name: '최신 이름' });
  [h.receipts[1], h.receipts[2]] = [h.receipts[2], h.receipts[1]];
  assert.deepEqual(h.post(), first);
  assert.equal(h.rows[1][5], '최신 이름');
  assert.equal(h.rows[1][19], '2');
  h.post({ ...baseInput, submissionId: thirdId, name: '다음 이름' });
  assert.equal(h.rows[1][19], '3');
});

test('접수 용량은 회원 수 기준이며 상한에서도 재참여와 UUID 재시도는 가능하다', () => {
  const h = harness();
  h.properties.MAX_SUBMISSIONS = '1';
  const first = h.post();
  assert.equal(first.ok, true);
  assert.equal(h.post({ ...baseInput, submissionId: nextId }).ok, true);
  assert.equal(
    h.post({ ...baseInput, submissionId: thirdId, memberId: '18' }).code,
    'CAPACITY_REACHED',
  );
  assert.deepEqual(h.post(), first);
  assert.equal(h.rows.length, 2);
  h.properties.MAX_RECEIPTS = '2';
  assert.equal(
    h.post({ ...baseInput, submissionId: thirdId }).code,
    'RECEIPT_CAPACITY_REACHED',
  );
  assert.deepEqual(h.post(), first);
  assert.equal(h.receipts.length, 3);
});

test('이력 기록 후 응모 쓰기가 실패하면 동일 UUID로 복구하고 미완료 예약도 회원 상한에 포함한다', () => {
  const h = harness();
  h.properties.MAX_SUBMISSIONS = '1';
  h.failWrite('응모');
  assert.equal(h.post().code, 'UNAVAILABLE');
  assert.equal(h.rows.length, 1);
  assert.equal(h.receipts.length, 2);
  assert.equal(
    h.post({ ...baseInput, submissionId: nextId, memberId: '18' }).code,
    'CAPACITY_REACHED',
  );
  const result = h.post();
  assert.equal(result.ok, true);
  assert.equal(h.rows.length, 2);
  assert.equal(h.receipts.length, 2);
  assert.equal(h.rows[1][19], '1');
});

test('기본 1000행 시트는 헤더를 포함한 한도를 넘기 전에 응모·이력 모두 확장한다', () => {
  const h = harness();
  assert.equal(h.post().ok, true);
  const templateEntry = h.rows[1];
  const templateReceipt = h.receipts[1];
  h.rows.splice(1);
  h.receipts.splice(1);
  for (let i = 1; i <= 999; i += 1) {
    const id = `${String(i).padStart(8, '0')}-394e-4a77-9c21-1221ea123456`;
    const entry = [...templateEntry];
    entry[3] = id;
    entry[4] = String(i);
    h.rows.push(entry);
    const record = [...templateReceipt];
    record[1] = id;
    record[2] = String(i);
    h.receipts.push(record);
  }
  const book = h.books.get('private-sheet');
  for (const sheet of book.getSheets()) {
    assert.equal(sheet.getLastRow(), 1000);
    assert.equal(sheet.getMaxRows(), 1000);
    assert.throws(() => sheet.getRange(1001, 1, 1, 1), /row limit/);
  }
  assert.equal(
    h.post({ ...baseInput, submissionId: nextId, memberId: '1000' }).ok,
    true,
  );
  for (const sheet of book.getSheets()) {
    assert.equal(sheet.getLastRow(), 1001);
    assert.equal(sheet.getMaxRows(), 1100);
    assert.equal(sheet.addedRows, 100);
  }
  assert.equal(
    h.post({ ...baseInput, submissionId: thirdId, memberId: '1000' }).ok,
    true,
  );
  assert.equal(h.rows.length, 1001);
  assert.equal(h.receipts.length, 1002);
  assert.equal(book.getSheetByName('접수이력').addedRows, 100);
});

test('마감·접수 중단·약관 변경 후에도 이미 받은 동일 UUID는 원래 계약으로 부분 저장을 복구한다', () => {
  for (const transition of [
    { apply: (h) => h.setNow(h.properties.END_AT), newCode: 'NOT_ACCEPTING' },
    {
      apply: (h) => {
        h.properties.ACCEPTING = 'false';
      },
      newCode: 'NOT_ACCEPTING',
    },
    {
      apply: (h) => {
        h.properties.RULES_VERSION = 'new-policy';
      },
      newCode: 'POLICY_CHANGED',
    },
  ]) {
    const h = harness();
    h.failWrite('응모');
    assert.equal(h.post().code, 'UNAVAILABLE');
    assert.equal(h.rows.length, 1);
    transition.apply(h);
    assert.equal(
      h.post({ ...baseInput, name: '바뀐 내용' }).code,
      'SUBMISSION_CONFLICT',
    );
    assert.equal(
      h.post({ ...baseInput, rulesVersion: 'new-policy' }).code,
      'SUBMISSION_CONFLICT',
    );
    const recovered = h.post();
    assert.equal(recovered.ok, true);
    assert.equal(recovered.receivedAt, '2026-11-16T12:00:00.000Z');
    assert.deepEqual(h.post(), recovered);
    assert.equal(h.rows.length, 2);
    assert.equal(h.rows[1][15], baseInput.rulesVersion);
    assert.equal(h.rows[1][19], '1');
    assert.equal(h.receipts.length, 2);
    assert.equal(
      h.post({ ...baseInput, submissionId: nextId }).code,
      transition.newCode,
    );
  }
});

test('마감 후 과거 UUID 재시도는 최신 응모와 운영 검증 결과를 그대로 보존한다', () => {
  const h = harness();
  const first = h.post();
  const newer = { ...baseInput, submissionId: nextId, name: '마지막 이름' };
  const second = h.post(newer);
  h.rows[1][18] = '검증 완료';
  h.setNow(h.properties.END_AT);
  h.properties.RULES_VERSION = 'changed-policy';
  assert.deepEqual(h.post(), first);
  assert.deepEqual(h.post(newer), second);
  assert.equal(h.rows[1][5], '마지막 이름');
  assert.equal(h.rows[1][18], '검증 완료');
  assert.equal(h.rows.length, 2);
});

test('원래 보관기한에 도달한 요청은 정리 실행 전에도 영수증 반환·응모 복구를 거절한다', () => {
  for (const partial of [true, false]) {
    const h = harness();
    if (partial) h.failWrite('응모');
    h.post();
    h.setNow('2026-12-31T00:00:00Z');
    // 나중에 기간 설정을 바꾸더라도 기존 이력의 보관기한을 연장하지 않는다.
    h.properties.END_AT = '2027-01-01T00:00:00Z';
    const snapshot = JSON.stringify(h.rows);
    assert.equal(h.post().code, 'NOT_ACCEPTING');
    assert.equal(JSON.stringify(h.rows), snapshot);
    assert.equal(h.receipts.length, 2);
  }
});

test('응모 갱신 실패 후 더 최신 요청이 성공해도 실패했던 과거 요청은 최신 행을 바꾸지 않는다', () => {
  const h = harness();
  h.post();
  h.failWrite('응모');
  const older = { ...baseInput, submissionId: nextId, name: '중간 요청' };
  assert.equal(h.post(older).code, 'UNAVAILABLE');
  const newer = { ...baseInput, submissionId: thirdId, name: '최신 요청' };
  assert.equal(h.post(newer).ok, true);
  assert.equal(h.post(older).ok, true);
  assert.equal(h.rows[1][5], '최신 요청');
  assert.equal(h.rows[1][19], '3');
  assert.equal(h.rows.length, 2);
});

test('이력·응모 응답 유실 또는 flush 실패 후 UUID 재시도는 중복을 만들지 않는다', () => {
  for (const fail of [
    (h) => h.failWrite('접수이력', 'before'),
    (h) => h.failWrite('접수이력', 'after'),
    (h) => h.failWrite('응모', 'after'),
    (h) => h.failFlush(),
  ]) {
    const h = harness();
    fail(h);
    assert.deepEqual(h.post(), { ok: false, code: 'UNAVAILABLE' });
    assert.equal(h.post().ok, true);
    assert.equal(h.rows.length, 2);
    assert.equal(h.receipts.length, 2);
    assert.equal(h.rows[1][19], '1');
  }
});

test('v4 직접 전달 본문의 허용 필드만 받고 사진·연락처·사연·토큰·잘못된 계약을 거절한다', () => {
  const h = harness();
  for (const field of [
    'phone',
    'reason',
    'photos',
    'accessToken',
    'authToken',
    'refreshToken',
    'idToken',
    'authorization',
    'tradeCount',
    'expectedMemberId',
    'payload',
    'timestamp',
    'signature',
  ]) {
    assert.equal(
      h.post({ ...baseInput, [field]: 'secret-input' }).code,
      'INVALID_INPUT',
      field,
    );
  }
  assert.equal(h.post({ ...baseInput, schemaVersion: 1 }).code, 'WRONG_EVENT');
  assert.equal(
    h.post({ ...baseInput, eventId: 'old-event' }).code,
    'WRONG_EVENT',
  );
  assert.equal(
    h.post({ ...baseInput, privacyConsent: false }).code,
    'CONSENT_REQUIRED',
  );
  assert.equal(
    h.post({ ...baseInput, rulesConsent: 'true' }).code,
    'CONSENT_REQUIRED',
  );
  assert.equal(
    h.post({ ...baseInput, rulesVersion: 'old' }).code,
    'POLICY_CHANGED',
  );
  assert.equal(h.rows.length, 1);
  assert.equal(h.receipts.length, 1);
});

test('회원·UUID·이름·정규화 인스타 ID·게시글 ID의 범위와 자료형을 엄격히 검증한다', () => {
  const h = harness();
  const invalid = {
    memberId: ['', '0', '-1', '01', '1.5', 17, '1'.repeat(20)],
    submissionId: ['bad', '019ab251-394e-1a77-9c21-1221ea123456'],
    name: ['', ' ', '가'.repeat(81), '줄\n바꿈', '\u0000'],
    instagramId: [
      '',
      '@gachi',
      'UPPER',
      '한글',
      'has space',
      'user/name',
      'a'.repeat(31),
    ],
    tradeIds: [
      [],
      null,
      '1',
      [0],
      [-1],
      [1.5],
      ['1'],
      [1, 1],
      [Number.MAX_SAFE_INTEGER + 1],
      Array.from({ length: 10001 }, (_, i) => i + 1),
    ],
  };
  for (const [field, values] of Object.entries(invalid)) {
    for (const value of values)
      assert.equal(
        h.post({ ...baseInput, [field]: value }).code,
        'INVALID_INPUT',
        field,
      );
  }
  assert.equal(
    h.post({
      ...baseInput,
      name: '가'.repeat(80),
      instagramId: 'a'.repeat(30),
      tradeIds: [1],
    }).ok,
    true,
  );
  assert.equal(h.rows[1][7], '1');
});

test('회원번호는 프론트엔드와 같은 안전 정수 범위만 받고 초과값은 저장하지 않는다', () => {
  const h = harness();
  for (const memberId of [
    '9007199254740992',
    '9007199254740993',
    '9999999999999999999',
  ]) {
    assert.equal(h.post({ ...baseInput, memberId }).code, 'INVALID_INPUT');
  }
  assert.equal(h.rows.length, 1);
  assert.equal(h.receipts.length, 1);
  const memberId = String(Number.MAX_SAFE_INTEGER);
  assert.equal(h.post({ ...baseInput, memberId }).ok, true);
  assert.equal(h.rows[1][4], memberId);
});

test('게시글 ID 10000개를 누락 없이 5개 셀로 나눠 저장한다', () => {
  const h = harness();
  const tradeIds = Array.from(
    { length: 10000 },
    (_, i) => Number.MAX_SAFE_INTEGER - i,
  ).reverse();
  assert.equal(h.post({ ...baseInput, tradeIds }).ok, true);
  assert.equal(h.rows[1][7], '10000');
  const cells = h.rows[1].slice(8, 13);
  assert.ok(cells.every((cell) => cell.length < 50000));
  assert.deepEqual(
    cells.flatMap((cell) => JSON.parse(cell)),
    tradeIds,
  );
});

test('잘못된 JSON·과도한 요청·내부 오류는 입력 내용이나 비밀 값을 응답에 노출하지 않는다', () => {
  const h = harness();
  assert.deepEqual(
    h.context.doPost({ postData: { contents: '{"secret-token":' } }),
    { ok: false, code: 'INVALID_INPUT' },
  );
  assert.equal(
    h.context.doPost({ postData: { contents: 'x'.repeat(262145) } }).code,
    'INVALID_INPUT',
  );
  assert.equal(
    h.context.doPost({
      postData: { contents: JSON.stringify({ name: '가'.repeat(90000) }) },
    }).code,
    'INVALID_INPUT',
  );
  for (const event of [undefined, {}, { postData: {} }])
    assert.equal(h.context.doPost(event).code, 'INVALID_INPUT');
  assert.equal(
    h.context.doPost({
      contentLength: 262145,
      postData: { contents: JSON.stringify(baseInput) },
    }).code,
    'INVALID_INPUT',
  );
  h.properties.SPREADSHEET_ID = 'secret-storage-id';
  assert.deepEqual(h.post(), { ok: false, code: 'UNAVAILABLE' });
  assert.equal(h.context.doGet().accepting, false);
  assert.ok(!JSON.stringify(h.context.doGet()).includes('secret-storage-id'));
});

test('수식으로 시작하는 이름은 텍스트 서식과 이스케이프로 저장한다', () => {
  for (const name of [
    '=IMPORTDATA("secret")',
    '+SUM(1,2)',
    '-1+1',
    '@formula',
  ]) {
    const h = harness();
    assert.equal(h.post({ ...baseInput, name }).ok, true);
    assert.equal(h.rows[1][5], `'${name}`);
    assert.ok(h.formats.every((format) => format === '@'));
  }
});

test('운영 설정·날짜·기간·접수 중지가 잘못되면 GET와 POST 모두 접수를 닫는다', () => {
  for (const change of [
    { PRIVACY_CONTROLLER: '' },
    { PRIVACY_CONTACT: '' },
    { PRIVACY_PURPOSE: '' },
    { PRIVACY_RETENTION_DAYS: '0' },
    { PRIVACY_RETENTION_DAYS: '366' },
    { MAX_SUBMISSIONS: '0' },
    { MAX_RECEIPTS: '' },
    { RULES_VERSION: '' },
    { ACCEPTING: 'false' },
    { START_AT: '2027-01-01T00:00:00Z' },
    { END_AT: '2026-11-15T00:00:00Z' },
    { END_AT: '2026-02-30T00:00:00Z' },
    { START_AT: '2026-11-01' },
    { END_AT: '2026-12-01T00:00:00+25:00' },
  ]) {
    const h = harness();
    Object.assign(h.properties, change);
    assert.equal(h.context.doGet().accepting, false, JSON.stringify(change));
    assert.equal(h.post().code, 'NOT_ACCEPTING');
    assert.equal(h.rows.length, 1);
  }
  for (const key of ['MAX_SUBMISSIONS', 'MAX_RECEIPTS']) {
    const h = harness();
    delete h.properties[key];
    assert.equal(h.context.doGet().accepting, false);
    assert.equal(h.post().code, 'NOT_ACCEPTING');
    assert.equal(h.rows.length, 1);
  }
  const h = harness();
  h.setNow(h.properties.START_AT);
  assert.equal(h.context.doGet().accepting, true);
  h.setNow(h.properties.END_AT);
  assert.equal(h.context.doGet().accepting, false);
  const metadata = h.context.doGet();
  assert.deepEqual(Object.keys(metadata), [
    'ok',
    'eventId',
    'schemaVersion',
    'authentication',
    'accepting',
    'startAt',
    'endAt',
    'rulesVersion',
    'privacy',
  ]);
  assert.equal(metadata.schemaVersion, 4);
  assert.equal(metadata.authentication, 'client-reported');
  assert.deepEqual(metadata.privacy.items, [
    '브라우저에서 전달한 로그인 회원번호',
    '이름',
    '인스타그램 ID',
    '브라우저에서 조회·전달한 본인 교환글 수 및 ID 목록',
    '동의 및 접수 기록',
  ]);
});

test('잠금 실패와 잠금 대기 중 설정 변경을 검증하고 잠금을 해제한다', () => {
  const h = harness();
  h.setLockAvailable(false);
  assert.equal(h.post().code, 'BUSY');
  assert.equal(h.lockReleases(), 0);
  h.setLockAvailable(true);
  h.setOnLock(() => {
    h.properties.ACCEPTING = 'false';
  });
  assert.equal(h.post().code, 'NOT_ACCEPTING');
  assert.equal(h.lockReleases(), 1);
  assert.equal(h.receipts.length, 1);
});

test('공개 저장소·헤더 수정·기존 v1 헤더·추가 열·누락된 이력은 실패하며 기존 데이터를 보존한다', () => {
  for (const mutate of [
    (h) => h.setSheetPrivate(false),
    (h) => {
      h.rows[0][0] = '접수일시';
    },
    (h) => {
      h.rows[0].push('추가열');
    },
    (h) => {
      h.receipts[0][0] = '잘못된이력';
    },
  ]) {
    const h = harness();
    mutate(h);
    const snapshot = JSON.stringify([h.rows, h.receipts]);
    assert.equal(h.context.doGet().accepting, false);
    assert.ok(
      ['STORAGE_NOT_READY', 'STORAGE_NOT_PRIVATE'].includes(h.post().code),
    );
    assert.equal(JSON.stringify([h.rows, h.receipts]), snapshot);
  }
  const h = harness();
  h.post();
  h.receipts.splice(1);
  assert.equal(
    h.post({ ...baseInput, submissionId: nextId }).code,
    'STORAGE_NOT_READY',
  );
});

test('설정은 새 비공개 스프레드시트에 두 시트만 만들며 기존 저장소가 있으면 생성하지 않는다', () => {
  const h = harness();
  assert.throws(() => h.context.setupLaunchEventStorage(), /새 프로젝트/);
  assert.equal(h.created(), 0);
  delete h.properties.SPREADSHEET_ID;
  h.properties.PHOTO_FOLDER_ID = 'legacy-folder';
  assert.throws(() => h.context.setupLaunchEventStorage(), /새 프로젝트/);
  assert.equal(h.created(), 0);
  delete h.properties.PHOTO_FOLDER_ID;
  h.setSheetPrivate(false);
  const result = h.context.setupLaunchEventStorage();
  assert.equal(result.accepting, false);
  assert.equal(h.created(), 1);
  assert.equal(h.properties.ACCEPTING, 'false');
  assert.equal('EVENT_RELAY_SECRET' in h.properties, false);
  assert.equal(h.properties.MAX_RECEIPTS, '100000');
  const book = h.books.get(result.spreadsheetId);
  assert.equal(book.timezone, 'Asia/Seoul');
  assert.deepEqual(
    book.getSheets().map((sheet) => sheet.name),
    ['응모', '접수이력'],
  );
  assert.deepEqual(book.getSheetByName('응모').rows[0], h.rows[0]);
  assert.deepEqual(book.getSheetByName('접수이력').rows[0], h.receipts[0]);
  assert.equal(h.context.doGet().accepting, false);
});

test('기존 v3 열과 데이터는 조회·새 회원 접수 때 보존하고 이전 전환 함수는 제공하지 않는다', () => {
  const h = harness();
  const first = h.post();
  assert.equal(first.ok, true);
  h.rows[1][18] = '로그인·게시글 확인 / 앱 설치 확인 필요';
  h.rows[1][16] = 'legacy-v3-fingerprint';
  h.receipts[1][3] = 'legacy-v3-fingerprint';
  const originalEntry = [...h.rows[1]];
  const originalReceipt = [...h.receipts[1]];
  const headers = JSON.stringify([h.rows[0], h.receipts[0]]);
  assert.equal(h.context.migrateEmptyLaunchEventStorageToVerified, undefined);
  assert.equal(h.context.doGet().accepting, true);
  assert.equal(
    h.post({ ...baseInput, memberId: '18', submissionId: nextId }).ok,
    true,
  );
  assert.equal(JSON.stringify([h.rows[0], h.receipts[0]]), headers);
  assert.deepEqual(h.rows[1], originalEntry);
  assert.deepEqual(h.receipts[1], originalReceipt);
  assert.equal(h.rows[2][18], '브라우저 전달 / 참여 조건 확인 필요');
  assert.equal(h.post().code, 'SUBMISSION_CONFLICT');
  assert.deepEqual(h.rows[1], originalEntry);
  assert.equal(h.created(), 0);
});

test('자가신고 구형 헤더를 자동 변환하거나 기존 데이터를 덮어쓰지 않는다', () => {
  const h = harness();
  h.rows[0][4] = '자가신고회원ID';
  h.rows[0][7] = '자가신고교환글수';
  h.receipts[0][2] = '자가신고회원ID';
  h.rows.push(['기존 데이터 보존']);
  const snapshot = JSON.stringify([h.rows, h.receipts]);
  assert.equal(h.context.doGet().accepting, false);
  assert.equal(h.post().code, 'STORAGE_NOT_READY');
  assert.equal(JSON.stringify([h.rows, h.receipts]), snapshot);
  assert.equal(h.created(), 0);
});

test('정리는 진행 중 이력을 지우지 않고 종료 후 기본 조회·명시 실행에서 해당 이벤트의 만료 행만 지운다', () => {
  const h = harness();
  h.post();
  h.post({ ...baseInput, submissionId: nextId });
  const foreignEntry = [...h.rows[1]];
  foreignEntry[2] = 'other-event';
  foreignEntry[3] = thirdId;
  h.rows.push(foreignEntry);
  const foreignReceipt = [...h.receipts[1]];
  foreignReceipt[0] = 'other-event';
  foreignReceipt[1] = thirdId;
  h.receipts.push(foreignReceipt);
  assert.equal(h.context.cleanupExpiredEntries(false).matchedEntries, 0);
  assert.equal(h.receipts.length, 4);
  h.setNow('2026-12-30T23:59:59Z');
  assert.equal(h.context.cleanupExpiredEntries().matchedEntries, 0);
  h.setNow('2026-12-31T00:00:00Z');
  const preview = h.context.cleanupExpiredEntries();
  assert.equal(preview.matchedEntries, 1);
  assert.equal(preview.matchedReceipts, 2);
  assert.equal(preview.dryRun, true);
  assert.equal(h.rows.length, 3);
  const deleted = h.context.cleanupExpiredEntries(false);
  assert.equal(deleted.matchedEntries, 1);
  assert.equal(deleted.matchedReceipts, 2);
  assert.equal(h.rows.length, 2);
  assert.equal(h.rows[1][2], 'other-event');
  assert.equal(h.receipts.length, 2);
  assert.equal(h.receipts[1][0], 'other-event');
  assert.equal(h.post().code, 'NOT_ACCEPTING');
});
