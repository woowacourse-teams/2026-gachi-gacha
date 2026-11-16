import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

import {
  createRelayServer,
  EVENT_PATH,
  loadConfig,
} from '../launch-event-relay/server.mjs';

const source = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
const baseInput = {
  eventId: 'app-launch-2026',
  schemaVersion: 3,
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
const relaySecret = 'a1'.repeat(32);

function signedEnvelope(input, timestamp, secret = relaySecret) {
  const payload = typeof input === 'string' ? input : JSON.stringify(input);
  return {
    payload,
    timestamp,
    signature: createHmac('sha256', secret)
      .update(`${timestamp}\n${payload}`, 'utf8')
      .digest('hex'),
  };
}

function harness() {
  const properties = {
    SPREADSHEET_ID: 'private-sheet',
    ACCEPTING: 'true',
    EVENT_RELAY_SECRET: relaySecret,
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
      computeHmacSha256Signature: (data, secret) =>
        Array.from(createHmac('sha256', secret).update(data, 'utf8').digest()),
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
    envelope: (input = baseInput, timestamp = now, secret = relaySecret) =>
      signedEnvelope(input, timestamp, secret),
    rawPost: (envelope) =>
      context.doPost({ postData: { contents: JSON.stringify(envelope) } }),
    post: (input = baseInput) =>
      context.doPost({
        postData: { contents: JSON.stringify(signedEnvelope(input, now)) },
      }),
  };
}

/** Run the actual relay against actual Code.gs handlers, replacing only I/O. */
async function relayThroughGas(t, h, secret = relaySecret) {
  const frontendOrigin = 'https://frontend.example.test';
  const apiOrigin = 'https://api.example.test';
  const gasUrl = 'https://script.google.com/macros/s/test-deployment/exec';
  const token = `header.${Buffer.from(JSON.stringify({ memberId: 17 })).toString('base64url')}.testsignature`;
  const calls = [];
  const tradeIds = Array.from({ length: 103 }, (_, index) => index + 1);
  const json = (value) =>
    new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json' },
    });
  const api = (data) => json({ code: 'C000', message: '성공', data });
  const server = createRelayServer(
    loadConfig({
      FRONTEND_ORIGIN: frontendOrigin,
      API_ORIGIN: apiOrigin,
      GAS_URL: gasUrl,
      EVENT_RELAY_SECRET: secret,
    }),
    {
      now: () => Date.parse('2026-11-16T12:00:00Z'),
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init });
        if (String(url) === gasUrl) {
          return json(
            init.method === 'POST'
              ? h.context.doPost({ postData: { contents: init.body } })
              : h.context.doGet(),
          );
        }
        assert.equal(init.headers.Authorization, `Bearer ${token}`);
        if (String(url) === `${apiOrigin}/api/v1/members/me`) {
          return api({
            nickname: null,
            profileImageUrl: null,
            desireTradeLocation: null,
          });
        }
        const request = new URL(url);
        assert.equal(request.origin, apiOrigin);
        assert.equal(request.pathname, '/api/v1/trades/me');
        assert.equal(request.searchParams.get('size'), '100');
        const page = Number(request.searchParams.get('page'));
        assert.ok(page === 0 || page === 1);
        return api({
          content: tradeIds
            .slice(page * 100, (page + 1) * 100)
            .map((tradeId) => ({
              tradeId,
              memberId: 17,
            })),
          number: page,
          size: 100,
          totalElements: tradeIds.length,
          totalPages: 2,
          last: page === 1,
        });
      },
    },
  );
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const browserInput = {
    schemaVersion: 3,
    eventId: baseInput.eventId,
    submissionId: baseInput.submissionId,
    expectedMemberId: '17',
    name: '테스트',
    instagramId: '@Gachi.test_17',
    privacyConsent: true,
    rulesConsent: true,
    rulesVersion: baseInput.rulesVersion,
  };
  return {
    calls,
    gasUrl,
    token,
    tradeIds,
    post: () =>
      fetch(`http://127.0.0.1:${server.address().port}${EVENT_PATH}`, {
        method: 'POST',
        headers: {
          Origin: frontendOrigin,
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(browserInput),
      }),
  };
}

test('실제 중계의 인증·전체 페이지 조회·서명이 실제 GAS 저장과 멱등 영수증으로 이어진다', async (t) => {
  const h = harness();
  const relay = await relayThroughGas(t, h);
  const response = await relay.post();
  assert.equal(response.status, 200);
  const receipt = await response.json();
  assert.deepEqual(receipt, {
    ok: true,
    eventId: baseInput.eventId,
    submissionId: baseInput.submissionId,
    receivedAt: '2026-11-16T12:00:00.000Z',
  });
  assert.equal(h.rows.length, 2);
  assert.equal(h.rows[1][4], '17');
  assert.equal(h.rows[1][6], 'gachi.test_17');
  assert.equal(h.rows[1][7], '103');
  assert.deepEqual(JSON.parse(h.rows[1][8]), relay.tradeIds);
  assert.equal(h.rows[1][18], '로그인·게시글 확인 / 앱 설치 확인 필요');
  const googleCalls = relay.calls.filter(({ url }) => url === relay.gasUrl);
  assert.equal(googleCalls.length, 2);
  assert.equal(JSON.stringify(googleCalls).includes(relay.token), false);
  const signedRequest = JSON.parse(googleCalls[1].init.body);
  const payload = JSON.parse(signedRequest.payload);
  assert.equal(payload.schemaVersion, 3);
  assert.equal(payload.memberId, '17');
  assert.equal('expectedMemberId' in payload, false);
  assert.deepEqual(payload.tradeIds, relay.tradeIds);
  const retry = await relay.post();
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), receipt);
  assert.equal(h.rows.length, 2);
  assert.equal(h.receipts.length, 2);
  assert.equal(h.rows[1][19], '1');
});

test('실제 중계와 GAS 비밀키가 다르면 실제 서명 검증이 실패하고 완료 응답·저장을 만들지 않는다', async (t) => {
  const h = harness();
  const relay = await relayThroughGas(t, h, 'b2'.repeat(32));
  const response = await relay.post();
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    ok: false,
    code: 'RECEIPT_UNCONFIRMED',
  });
  assert.equal(h.rows.length, 1);
  assert.equal(h.receipts.length, 1);
  assert.equal(h.lockReleases(), 0);
});

test('최초 접수는 서버 검증 값·동의·이벤트 종료 후 삭제일을 저장하고 같은 UUID는 같은 영수증을 반환한다', () => {
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
  assert.equal(h.rows[1][18], '로그인·게시글 확인 / 앱 설치 확인 필요');
  assert.equal(h.rows[1][19], '1');
});

test('서명 없는 브라우저 직접 요청·기존 v2 요청은 저장소에 접근하기 전에 거절한다', () => {
  const h = harness();
  h.properties.SPREADSHEET_ID = 'unreachable-storage';
  for (const input of [
    baseInput,
    { ...baseInput, schemaVersion: 2 },
    {},
    null,
    [],
  ]) {
    assert.deepEqual(h.rawPost(input), { ok: false, code: 'AUTH_REQUIRED' });
  }
  assert.equal(h.lockReleases(), 0);
  assert.equal(h.rows.length, 1);
  assert.equal(h.receipts.length, 1);
});

test('서명 본문의 회원·게시글·개인정보나 타임스탬프를 변조하면 거절한다', () => {
  const h = harness();
  const envelope = h.envelope();
  for (const change of [
    { memberId: '18' },
    { tradeIds: [99] },
    { name: '다른 사람' },
    { instagramId: 'other.user' },
  ]) {
    assert.equal(
      h.rawPost({
        ...envelope,
        payload: JSON.stringify({ ...baseInput, ...change }),
      }).code,
      'AUTH_REQUIRED',
    );
  }
  for (const change of [
    { timestamp: envelope.timestamp + 1 },
    {
      signature:
        envelope.signature.slice(0, -1) +
        (envelope.signature.endsWith('0') ? '1' : '0'),
    },
    { signature: envelope.signature.toUpperCase() },
    { signature: '0'.repeat(63) },
    { extra: 'unexpected' },
  ]) {
    assert.equal(h.rawPost({ ...envelope, ...change }).code, 'AUTH_REQUIRED');
  }
  assert.equal(
    h.rawPost(h.envelope(baseInput, envelope.timestamp, 'b2'.repeat(32))).code,
    'AUTH_REQUIRED',
  );
  assert.equal(h.rows.length, 1);
  assert.equal(h.receipts.length, 1);
});

test('서명 타임스탬프는 밀리초 정수이며 5분 유효 범위를 벗어나면 거절한다', () => {
  const h = harness();
  const now = h.envelope().timestamp;
  for (const timestamp of [
    now - 300001,
    now + 300001,
    now / 1000,
    now + 0.5,
    String(now),
    null,
  ]) {
    assert.equal(
      h.rawPost(h.envelope(baseInput, timestamp)).code,
      'AUTH_REQUIRED',
    );
  }
  assert.equal(h.rawPost(h.envelope(baseInput, now - 300000)).ok, true);
  assert.equal(h.rawPost(h.envelope(baseInput, now + 300000)).ok, true);
  assert.equal(h.rows.length, 2);
  assert.equal(h.receipts.length, 2);
});

test('동일 서명 요청 재전송은 영수증만 재사용하고 만료 후에는 새 서명이 필요하다', () => {
  const h = harness();
  const envelope = h.envelope();
  const receipt = h.rawPost(envelope);
  assert.equal(receipt.ok, true);
  assert.deepEqual(h.rawPost(envelope), receipt);
  h.setNow('2026-11-16T12:05:01Z');
  assert.equal(h.rawPost(envelope).code, 'AUTH_REQUIRED');
  assert.deepEqual(h.post(), receipt);
  assert.equal(h.rows.length, 2);
  assert.equal(h.receipts.length, 2);
});

test('서명이 있어도 잘못된 JSON·v2 본문·토큰 포함 본문은 저장하지 않는다', () => {
  const h = harness();
  assert.equal(h.rawPost(h.envelope('{"secret":')).code, 'INVALID_INPUT');
  assert.equal(h.post({ ...baseInput, schemaVersion: 2 }).code, 'WRONG_EVENT');
  assert.equal(
    h.post({ ...baseInput, accessToken: 'must-not-leave-relay' }).code,
    'INVALID_INPUT',
  );
  assert.equal(h.rawPost(h.envelope('가'.repeat(90000))).code, 'INVALID_INPUT');
  assert.equal(h.rows.length, 1);
});

test('비밀키 누락·잘못된 형식은 접수를 닫고 메타데이터나 오류에 키를 노출하지 않는다', () => {
  for (const secret of [
    '',
    'short',
    'z'.repeat(64),
    'a'.repeat(63),
    ` ${relaySecret}`,
  ]) {
    const h = harness();
    h.properties.EVENT_RELAY_SECRET = secret;
    const metadata = h.context.doGet();
    assert.equal(metadata.accepting, false);
    assert.equal(h.post().code, 'AUTH_REQUIRED');
    assert.ok(!Object.hasOwn(metadata, 'relaySecret'));
    assert.ok(!JSON.stringify(metadata).includes(relaySecret));
    assert.equal(h.rows.length, 1);
  }
  const h = harness();
  const metadata = h.context.doGet();
  assert.equal(metadata.accepting, true);
  assert.ok(!JSON.stringify(metadata).includes(relaySecret));
});

test('잠금 대기 중 비밀키가 교체되면 기존 키로 서명된 요청을 접수하지 않는다', () => {
  const h = harness();
  h.setOnLock(() => {
    h.properties.EVENT_RELAY_SECRET = 'b2'.repeat(32);
  });
  assert.equal(h.post().code, 'AUTH_REQUIRED');
  assert.equal(h.lockReleases(), 1);
  assert.equal(h.rows.length, 1);
  assert.equal(h.receipts.length, 1);
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
  assert.equal(h.rows[1][18], '로그인·게시글 확인 / 앱 설치 확인 필요');
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

test('v3 서명 본문의 허용 필드만 받고 사진·연락처·사연·토큰·잘못된 계약을 거절한다', () => {
  const h = harness();
  for (const field of [
    'phone',
    'reason',
    'photos',
    'accessToken',
    'idToken',
    'tradeCount',
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
  assert.equal(metadata.schemaVersion, 3);
  assert.equal(metadata.authentication, 'server-verified');
  assert.deepEqual(metadata.privacy.items, [
    '로그인 회원번호',
    '이름',
    '인스타그램 ID',
    '서버에서 조회한 본인 교환글 수 및 ID 목록',
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
  assert.equal(h.properties.EVENT_RELAY_SECRET, '');
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

function installLegacyHeaders(h) {
  h.rows[0] = Array.from(vm.runInContext('LEGACY_HEADERS', h.context));
  h.receipts[0] = Array.from(
    vm.runInContext('LEGACY_RECEIPT_HEADERS', h.context),
  );
}

test('기존 v2 헤더는 자동 전환하지 않고 접수 중단 상태의 빈 두 탭만 명시적으로 전환한다', () => {
  const h = harness();
  installLegacyHeaders(h);
  const snapshot = JSON.stringify([h.rows, h.receipts]);
  assert.equal(h.context.doGet().accepting, false);
  assert.equal(h.post().code, 'STORAGE_NOT_READY');
  assert.equal(JSON.stringify([h.rows, h.receipts]), snapshot);
  assert.throws(
    () => h.context.migrateEmptyLaunchEventStorageToVerified(),
    /접수를 중단/,
  );
  assert.equal(JSON.stringify([h.rows, h.receipts]), snapshot);
  h.properties.ACCEPTING = 'false';
  const result = h.context.migrateEmptyLaunchEventStorageToVerified();
  assert.equal(result.schemaVersion, 3);
  assert.equal(result.accepting, false);
  assert.equal(h.rows[0][4], '회원ID');
  assert.equal(h.rows[0][7], '교환글수');
  assert.equal(h.rows[0][8], '교환글ID목록1');
  assert.equal(h.receipts[0][2], '회원ID');
  assert.equal(h.properties.ACCEPTING, 'false');
  assert.equal(h.created(), 0);
  assert.equal(
    h.context.migrateEmptyLaunchEventStorageToVerified().schemaVersion,
    3,
  );
  h.properties.ACCEPTING = 'true';
  assert.equal(h.post().ok, true);
});

test('전환 시 어느 한 탭이라도 기존 데이터·오염된 헤더·공개 권한이 있으면 양쪽 모두 보존한다', () => {
  for (const mutate of [
    (h) => h.rows.push(['기존 미검증 응모']),
    (h) => h.receipts.push(['기존 미검증 접수이력']),
    (h) => {
      h.receipts[0][0] = '다른 헤더';
    },
    (h) => {
      h.rows[0].push('추가 열');
    },
    (h) => h.setSheetPrivate(false),
  ]) {
    const h = harness();
    installLegacyHeaders(h);
    h.properties.ACCEPTING = 'false';
    mutate(h);
    const snapshot = JSON.stringify([h.rows, h.receipts]);
    assert.throws(() => h.context.migrateEmptyLaunchEventStorageToVerified());
    assert.equal(JSON.stringify([h.rows, h.receipts]), snapshot);
    assert.equal(h.created(), 0);
    assert.equal(h.properties.ACCEPTING, 'false');
  }
});

test('빈 시트 전환 중 부분 쓰기 오류가 나도 기존 응모는 만들지 않으며 재실행으로 헤더만 복구한다', () => {
  const h = harness();
  installLegacyHeaders(h);
  h.properties.ACCEPTING = 'false';
  h.failWrite('접수이력');
  assert.throws(() => h.context.migrateEmptyLaunchEventStorageToVerified());
  assert.equal(h.rows.length, 1);
  assert.equal(h.receipts.length, 1);
  assert.equal(h.context.doGet().accepting, false);
  assert.equal(
    h.context.migrateEmptyLaunchEventStorageToVerified().schemaVersion,
    3,
  );
  assert.equal(h.rows[0][4], '회원ID');
  assert.equal(h.receipts[0][2], '회원ID');
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
