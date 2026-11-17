import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { test } from 'node:test';

import { createRelayServer, EVENT_PATH, loadConfig } from './server.mjs';

const NOW = Date.parse('2026-11-20T03:00:00.000Z');
const ENV = {
  FRONTEND_ORIGIN: 'https://frontend.example.test',
  API_ORIGIN: 'https://api.example.test',
  GAS_URL: 'https://script.google.com/macros/s/test-deployment/exec',
  EVENT_RELAY_SECRET: '0123456789abcdef'.repeat(4),
};
const CONFIG = loadConfig(ENV);
const INPUT = {
  eventId: 'app-launch-2026',
  schemaVersion: 3,
  submissionId: '12345678-1234-4123-8123-123456789abc',
  name: '참여자',
  instagramId: '@Gachi.test',
  privacyConsent: true,
  rulesConsent: true,
  rulesVersion: 'v3-test',
  expectedMemberId: '42',
};
const SETTINGS = {
  ok: true,
  eventId: INPUT.eventId,
  schemaVersion: 3,
  authentication: 'server-verified',
  accepting: true,
  startAt: '2026-11-10T00:00:00+09:00',
  endAt: '2026-11-28T00:00:00+09:00',
  rulesVersion: INPUT.rulesVersion,
  privacy: {
    controller: '테스트 팀',
    contact: '@test',
    purpose: '응모 확인',
    items: ['이름', '인스타그램 ID', '회원 ID', '게시글 ID'],
    retentionDays: 30,
  },
};
const MEMBER = {
  nickname: null,
  profileImageUrl: null,
  desireTradeLocation: null,
};
const token = (id = 42) =>
  `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify({ memberId: id })).toString('base64url')}.testsignature`;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const api = (data) => json({ code: 'C000', message: '성공', data });
const page = (ids = [1], number = 0, totalElements = ids.length) => ({
  content: ids.map((tradeId) => ({ tradeId, memberId: 42 })),
  number,
  size: 100,
  totalElements,
  totalPages: Math.ceil(totalElements / 100),
  last: number + 1 >= Math.ceil(totalElements / 100),
});

function fixture(overrides = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url) === CONFIG.gasUrl) {
      if (init.method === 'POST') {
        if (overrides.googlePost) return overrides.googlePost(init);
        const payload = JSON.parse(JSON.parse(init.body).payload);
        return json({
          ok: true,
          eventId: payload.eventId,
          submissionId: payload.submissionId,
          receivedAt: new Date(NOW).toISOString(),
        });
      }
      return overrides.googleGet ? overrides.googleGet(init) : json(SETTINGS);
    }
    if (String(url) === `${CONFIG.apiOrigin}/api/v1/members/me`)
      return overrides.member ? overrides.member(init) : api(MEMBER);
    if (String(url).startsWith(`${CONFIG.apiOrigin}/api/v1/trades/me?`))
      return overrides.trades
        ? overrides.trades(new URL(url), init)
        : api(page());
    if (overrides.redirect) return overrides.redirect(String(url), init);
    throw new Error('Unexpected fake upstream request');
  };
  return { calls, fetchImpl };
}

async function start(t, options = {}, config = CONFIG) {
  const f = fixture(options);
  const server = createRelayServer(config, {
    fetchImpl: f.fetchImpl,
    now: () => NOW,
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}${EVENT_PATH}`;
  const post = (body = INPUT, init = {}) =>
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      ...init,
      headers: {
        Origin: CONFIG.frontendOrigin,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
        ...init.headers,
      },
    });
  return { ...f, server, url, post };
}

test('configuration accepts fixed HTTPS origins and loopback, rejects unsafe URLs and secrets', () => {
  assert.equal(CONFIG.port, 3101);
  assert.equal(
    loadConfig({ ...ENV, API_ORIGIN: 'http://127.0.0.1:8080' }).apiOrigin,
    'http://127.0.0.1:8080',
  );
  for (const patch of [
    { FRONTEND_ORIGIN: 'https://example.test/path' },
    { API_ORIGIN: 'http://attacker.test' },
    { GAS_URL: 'https://script.google.com.evil.test/macros/s/id/exec' },
    { GAS_URL: `${ENV.GAS_URL}?token=secret` },
    { GAS_URL: 'https://user:pass@script.google.com/macros/s/id/exec' },
    { EVENT_RELAY_SECRET: 'short' },
    { PORT: '0' },
    { MAX_CONCURRENT: '99' },
  ])
    assert.throws(
      () => loadConfig({ ...ENV, ...patch }),
      /^Error: INVALID_CONFIGURATION$/,
    );
});

test('GET returns validated metadata only and explicitly disables caching', async (t) => {
  const f = await start(t, {
    googleGet: () => json({ ...SETTINGS, secret: 'do not expose' }),
  });
  const response = await fetch(f.url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), SETTINGS);
  assert.equal(f.calls.length, 1);
});

test('POST authenticates first, reads all latest pages and signs trusted identity without sending token to Google', async (t) => {
  const f = await start(t, {
    trades: (url) => {
      assert.equal(url.searchParams.get('size'), '100');
      const n = Number(url.searchParams.get('page'));
      return api(
        page(
          n === 0
            ? Array.from({ length: 100 }, (_, i) => i + 1)
            : [101, 102, 103],
          n,
          103,
        ),
      );
    },
  });
  const response = await f.post();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    eventId: INPUT.eventId,
    submissionId: INPUT.submissionId,
    receivedAt: new Date(NOW).toISOString(),
  });
  assert.deepEqual(
    f.calls.map((c) => [new URL(c.url).pathname, c.init.method]),
    [
      ['/macros/s/test-deployment/exec', 'GET'],
      ['/api/v1/members/me', 'GET'],
      ['/api/v1/trades/me', 'GET'],
      ['/api/v1/trades/me', 'GET'],
      ['/macros/s/test-deployment/exec', 'POST'],
    ],
  );
  const envelope = JSON.parse(f.calls.at(-1).init.body);
  const payload = JSON.parse(envelope.payload);
  assert.equal(payload.memberId, '42');
  assert.equal(payload.instagramId, 'gachi.test');
  assert.deepEqual(
    payload.tradeIds,
    Array.from({ length: 103 }, (_, i) => i + 1),
  );
  assert.equal(payload.expectedMemberId, undefined);
  assert.equal(envelope.timestamp, NOW);
  assert.equal(
    envelope.signature,
    createHmac('sha256', ENV.EVENT_RELAY_SECRET)
      .update(`${NOW}\n${envelope.payload}`)
      .digest('hex'),
  );
  for (const c of f.calls) {
    assert.equal(c.init.redirect, 'manual');
    if (new URL(c.url).hostname === 'script.google.com') {
      assert.equal(new Headers(c.init.headers).has('authorization'), false);
      assert.equal(JSON.stringify(c.init).includes(token()), false);
    } else
      assert.equal(
        new Headers(c.init.headers).get('authorization'),
        `Bearer ${token()}`,
      );
  }
});

test('client memberId, tradeIds, tokens and other unknown fields are rejected before upstream calls', async (t) => {
  const f = await start(t);
  for (const field of [
    { memberId: '7' },
    { tradeIds: [9] },
    { accessToken: token() },
    { url: 'https://evil.test' },
  ]) {
    const response = await f.post({ ...INPUT, ...field });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'INVALID_INPUT');
  }
  assert.equal(f.calls.length, 0);
});

test('same-origin, method, path, JSON and bearer guards reject invalid requests', async (t) => {
  const f = await start(t);
  for (const [response, status, code] of [
    [
      await f.post(INPUT, { headers: { Origin: 'https://evil.test' } }),
      403,
      'ORIGIN_REJECTED',
    ],
    [await f.post(INPUT, { headers: { Origin: '' } }), 403, 'ORIGIN_REJECTED'],
    [
      await f.post(INPUT, { headers: { 'Sec-Fetch-Site': 'cross-site' } }),
      403,
      'ORIGIN_REJECTED',
    ],
    [
      await f.post(INPUT, { headers: { 'Content-Type': 'text/plain' } }),
      415,
      'UNSUPPORTED_CONTENT_TYPE',
    ],
    [
      await f.post(INPUT, { headers: { Authorization: '' } }),
      401,
      'LOGIN_REQUIRED',
    ],
    [await fetch(f.url, { method: 'OPTIONS' }), 405, 'METHOD_NOT_ALLOWED'],
    [await fetch(`${f.url}?token=hidden`), 404, 'NOT_FOUND'],
  ]) {
    assert.equal(response.status, status);
    assert.equal((await response.json()).code, code);
  }
  assert.equal(f.calls.length, 0);
});

test('invalid consent, UUID and Instagram are rejected without upstream side effects', async (t) => {
  const f = await start(t);
  for (const patch of [
    { privacyConsent: false },
    { rulesConsent: false },
    { submissionId: '123' },
    { instagramId: 'https://instagram.com/test' },
    { name: '' },
    { expectedMemberId: 42 },
  ]) {
    const response = await f.post({ ...INPUT, ...patch });
    assert.equal(response.status, 400);
  }
  assert.equal(f.calls.length, 0);
});

test('a rejected /me token never reaches trade fetch or Google write, even with readable member claim', async (t) => {
  const f = await start(t, {
    member: () => json({ message: 'sensitive auth detail' }, 401),
  });
  const response = await f.post(INPUT, {
    headers: { Authorization: `Bearer ${token(999)}` },
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    ok: false,
    code: 'LOGIN_REQUIRED',
  });
  assert.equal(f.calls.length, 2);
});

test('member claim is decoded only after a strict successful /me response', async (t) => {
  const f = await start(t, { member: () => api({}) });
  const response = await f.post(INPUT, {
    headers: { Authorization: 'Bearer header.bm90LWpzb24.signature' },
  });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, 'INVALID_UPSTREAM_RESPONSE');
  assert.equal(f.calls.length, 2);
});

test('malformed claims and /me identity mismatch fail after authentication', async (t) => {
  const f = await start(t);
  for (const badToken of [
    'header.bm90LWpzb24.signature',
    token(-1),
    token('9007199254740993'),
  ]) {
    const response = await f.post(INPUT, {
      headers: { Authorization: `Bearer ${badToken}` },
    });
    assert.equal(response.status, 401);
  }
  const g = await start(t, { member: () => api({ ...MEMBER, memberId: 9 }) });
  assert.equal((await g.post()).status, 401);
  assert.equal(g.calls.length, 2);
});

test('expected member mismatch protects an account switch but cannot set identity', async (t) => {
  const f = await start(t);
  const response = await f.post({ ...INPUT, expectedMemberId: '9' });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'MEMBER_MISMATCH');
  assert.equal(f.calls.length, 2);
});

test('all trades must belong to the authenticated user and be complete', async (t) => {
  for (const badPage of [
    { ...page(), content: [{ tradeId: 1, memberId: 9 }] },
    { ...page(), number: 1 },
    { ...page(), size: 0 },
    { ...page(), content: [{ tradeId: -1, memberId: 42 }] },
    { ...page([1, 1]), totalElements: 2 },
    { ...page(), totalElements: 10001, totalPages: 101, last: false },
    { ...page(), totalElements: 2 },
  ]) {
    const f = await start(t, { trades: () => api(badPage) });
    const response = await f.post();
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, 'INVALID_UPSTREAM_RESPONSE');
    assert.equal(
      f.calls.some((c) => c.url === CONFIG.gasUrl && c.init.method === 'POST'),
      false,
    );
  }
});

test('an empty trade list cannot qualify and changing pagination totals fail closed', async (t) => {
  const f = await start(t, { trades: () => api(page([])) });
  const response = await f.post();
  assert.equal(response.status, 422);
  assert.equal((await response.json()).code, 'PARTICIPATION_REQUIRED');
  const g = await start(t, {
    trades: (url) => {
      const n = Number(url.searchParams.get('page'));
      return api(
        page(
          n ? [101] : Array.from({ length: 100 }, (_, i) => i + 1),
          n,
          n ? 102 : 101,
        ),
      );
    },
  });
  assert.equal((await g.post()).status, 502);
  assert.equal(g.calls.length, 4);
});

test('missing total counts requires last marker, duplicates are deduplicated and pages must progress', async (t) => {
  const f = await start(t, {
    trades: (url) => {
      const n = Number(url.searchParams.get('page'));
      return api({
        content: (n ? [1, 2] : [1]).map((tradeId) => ({
          tradeId,
          memberId: 42,
        })),
        number: n,
        size: 100,
        last: n === 1,
      });
    },
  });
  assert.equal((await f.post()).status, 200);
  assert.deepEqual(
    JSON.parse(JSON.parse(f.calls.at(-1).init.body).payload).tradeIds,
    [1, 2],
  );
  const g = await start(t, {
    trades: (url) =>
      api({
        content: [{ tradeId: 1, memberId: 42 }],
        number: Number(url.searchParams.get('page')),
        size: 100,
        last: false,
      }),
  });
  assert.equal((await g.post()).status, 502);
  assert.equal(g.calls.length, 4);
});

test('old, incomplete, closed or changed policy metadata blocks API calls and writes', async (t) => {
  for (const patch of [
    { schemaVersion: 2 },
    { authentication: 'self-reported' },
    { privacy: {} },
    { accepting: false },
    { rulesVersion: 'new-version' },
    { endAt: '2026-11-15T00:00:00Z' },
  ]) {
    const f = await start(t, {
      googleGet: () => json({ ...SETTINGS, ...patch }),
    });
    const response = await f.post();
    assert.ok([409, 503].includes(response.status));
    assert.equal(f.calls.length, 1);
  }
});

test('only Google ContentService result redirects are followed as credential-free GET', async (t) => {
  let submitted;
  const f = await start(t, {
    googlePost: (init) => {
      submitted = JSON.parse(JSON.parse(init.body).payload);
      return new Response(null, {
        status: 302,
        headers: {
          Location:
            'https://script.googleusercontent.com/macros/echo?user_content_key=test',
        },
      });
    },
    redirect: (url, init) => {
      assert.equal(new URL(url).hostname, 'script.googleusercontent.com');
      assert.equal(init.method, 'GET');
      assert.equal(init.body, undefined);
      assert.equal(init.headers, undefined);
      return json({
        ok: true,
        eventId: submitted.eventId,
        submissionId: submitted.submissionId,
        receivedAt: new Date(NOW).toISOString(),
      });
    },
  });
  assert.equal((await f.post()).status, 200);
  for (const c of f.calls.filter((c) =>
    new URL(c.url).hostname.includes('google'),
  ))
    assert.equal(JSON.stringify(c.init).includes(token()), false);
});

test('Google and API redirects cannot leak credentials to arbitrary destinations', async (t) => {
  for (const destination of [
    'https://evil.test',
    'http://script.googleusercontent.com/path',
    'https://script.googleusercontent.com.evil.test/path',
    'https://user:pass@script.googleusercontent.com/path',
  ]) {
    const f = await start(t, {
      googleGet: () =>
        new Response(null, { status: 302, headers: { Location: destination } }),
    });
    assert.equal((await f.post()).status, 502);
    assert.equal(f.calls.length, 1);
  }
  const g = await start(t, {
    member: () =>
      new Response(null, {
        status: 302,
        headers: { Location: 'https://evil.test' },
      }),
  });
  assert.equal((await g.post()).status, 503);
  assert.equal(g.calls.length, 2);
});

test('receipt must match request and upstream details never escape safe errors', async (t) => {
  for (const result of [
    {
      ok: true,
      eventId: INPUT.eventId,
      submissionId: 'wrong',
      receivedAt: new Date(NOW).toISOString(),
    },
    { ok: false, code: 'secret@example.test' },
    {
      ok: true,
      eventId: INPUT.eventId,
      submissionId: INPUT.submissionId,
      receivedAt: 'wrong',
    },
  ]) {
    const f = await start(t, { googlePost: () => json(result) });
    const response = await f.post();
    assert.equal((await response.json()).code, 'RECEIPT_UNCONFIRMED');
  }
  const g = await start(t, {
    googlePost: () => json({ ok: false, code: 'POLICY_CHANGED' }),
  });
  assert.equal((await (await g.post()).json()).code, 'POLICY_CHANGED');
});

test('oversized request and upstream response bodies are bounded', async (t) => {
  const f = await start(t);
  assert.equal(
    (await f.post({ ...INPUT, name: 'a'.repeat(17000) })).status,
    413,
  );
  assert.equal(f.calls.length, 0);
  const g = await start(t, {
    googleGet: () => json({ ...SETTINGS, padding: 'x'.repeat(66000) }),
  });
  assert.equal((await fetch(g.url)).status, 413);
});

test('global timeout aborts upstream and releases capacity', async (t) => {
  const f = await start(
    t,
    {
      googleGet: ({ signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        }),
    },
    { ...CONFIG, requestTimeoutMs: 50, maxConcurrent: 1 },
  );
  const first = fetch(f.url);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const second = await fetch(f.url);
  assert.equal(second.status, 429);
  assert.equal((await second.json()).code, 'BUSY');
  assert.equal((await first).status, 504);
  assert.equal((await fetch(f.url)).status, 504);
});

test('a stalled incoming body is terminated by the application deadline', async (t) => {
  const f = await start(t, {}, { ...CONFIG, requestTimeoutMs: 50 });
  const response = await new Promise((resolve, reject) => {
    const req = httpRequest(
      f.url,
      {
        method: 'POST',
        headers: {
          Origin: CONFIG.frontendOrigin,
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
      },
      (res) => {
        res.resume();
        res.once('end', () => {
          resolve(res.statusCode);
          req.destroy();
        });
      },
    );
    req.on('error', (error) => {
      if (error.code !== 'ECONNRESET') reject(error);
    });
    req.write('{');
  });
  assert.equal(response, 504);
  assert.equal(f.calls.length, 0);
});
