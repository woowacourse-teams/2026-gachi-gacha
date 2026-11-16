import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export const EVENT_PATH = '/event-api/launch-event';
const EVENT_ID = 'app-launch-2026';
const SCHEMA_VERSION = 3;
const INPUT_LIMIT = 16 * 1024;
const API_LIMIT = 2 * 1024 * 1024;
const METADATA_LIMIT = 64 * 1024;
const MAX_TRADES = 10000;
const PAGE_SIZE = 100;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class RelayError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function fail(code, status) {
  throw new RelayError(code, status);
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function integer(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function memberId(value) {
  const text = typeof value === 'number' ? String(value) : value;
  return typeof text === 'string' &&
    /^[1-9]\d*$/.test(text) &&
    Number.isSafeInteger(Number(text))
    ? text
    : null;
}

function nonempty(value, limit = 1000) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= limit
  );
}

function date(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) &&
    Number.isFinite(Date.parse(value))
  );
}

function origin(value) {
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    fail('INVALID_CONFIGURATION', 500);
  }
  return url.origin;
}

export function loadConfig(env = process.env) {
  try {
    const google = new URL(env.GAS_URL);
    const port = Number(env.PORT || '3101');
    const maxConcurrent = Number(env.MAX_CONCURRENT || '4');
    const requestTimeoutMs = Number(env.REQUEST_TIMEOUT_MS || '45000');
    if (
      google.protocol !== 'https:' ||
      google.hostname !== 'script.google.com' ||
      google.port ||
      google.username ||
      google.password ||
      google.search ||
      google.hash ||
      !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(google.pathname) ||
      !/^[a-f0-9]{64}$/i.test(env.EVENT_RELAY_SECRET || '') ||
      !Number.isInteger(port) ||
      port < 1024 ||
      port > 65535 ||
      !Number.isInteger(maxConcurrent) ||
      maxConcurrent < 1 ||
      maxConcurrent > 8 ||
      !Number.isInteger(requestTimeoutMs) ||
      requestTimeoutMs < 1000 ||
      requestTimeoutMs > 60000
    ) {
      fail('INVALID_CONFIGURATION', 500);
    }
    return Object.freeze({
      frontendOrigin: origin(env.FRONTEND_ORIGIN),
      apiOrigin: origin(env.API_ORIGIN),
      gasUrl: google.href,
      secret: env.EVENT_RELAY_SECRET,
      port,
      maxConcurrent,
      requestTimeoutMs,
    });
  } catch {
    // Never print the supplied configuration: it contains the signing secret.
    throw new Error('INVALID_CONFIGURATION');
  }
}

async function bodyText(stream, limit, signal) {
  let bytes = 0;
  const chunks = [];
  for await (const part of stream) {
    signal.throwIfAborted();
    const chunk = Buffer.from(part);
    bytes += chunk.length;
    if (bytes > limit) fail('BODY_TOO_LARGE', 413);
    chunks.push(chunk);
  }
  signal.throwIfAborted();
  return Buffer.concat(chunks).toString('utf8');
}

function inputText(req, signal) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const cleanup = () => {
      req.off('data', onData);
      req.off('end', onEnd);
      req.off('error', onError);
      signal.removeEventListener('abort', onAbort);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onAbort = () => {
      onError(signal.reason);
      req.resume();
    };
    const onData = (chunk) => {
      size += chunk.length;
      if (size > INPUT_LIMIT) {
        onError(new RelayError('BODY_TOO_LARGE', 413));
        req.resume();
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = () => {
      cleanup();
      resolve(Buffer.concat(chunks).toString('utf8'));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    req.on('data', onData);
    req.once('end', onEnd);
    req.once('error', onError);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function responseJson(response, limit, signal) {
  if (
    !response.headers
      .get('content-type')
      ?.toLowerCase()
      .includes('application/json') ||
    Number(response.headers.get('content-length')) > limit ||
    !response.body
  ) {
    await response.body?.cancel();
    fail('INVALID_UPSTREAM_RESPONSE', 502);
  }
  try {
    const value = JSON.parse(await bodyText(response.body, limit, signal));
    if (!record(value)) fail('INVALID_UPSTREAM_RESPONSE', 502);
    return value;
  } catch (error) {
    if (signal.aborted) throw signal.reason;
    if (error instanceof RelayError) throw error;
    fail('INVALID_UPSTREAM_RESPONSE', 502);
  }
}

async function request(fetchImpl, url, init, signal) {
  try {
    return await fetchImpl(url, {
      ...init,
      redirect: 'manual',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal,
    });
  } catch {
    if (signal.aborted) throw signal.reason;
    fail('UPSTREAM_UNAVAILABLE', 503);
  }
}

async function googleJson(config, fetchImpl, init, signal) {
  let response = await request(fetchImpl, config.gasUrl, init, signal);
  if ([302, 303].includes(response.status)) {
    const location = response.headers.get('location');
    await response.body?.cancel();
    let url;
    try {
      url = new URL(location, config.gasUrl);
    } catch {
      fail('INVALID_UPSTREAM_RESPONSE', 502);
    }
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'script.googleusercontent.com' ||
      url.port ||
      url.username ||
      url.password ||
      url.hash
    )
      fail('INVALID_UPSTREAM_RESPONSE', 502);
    // Apps Script ContentService redirects to a one-use result URL. Do not
    // replay the POST payload or attach any token/signature header to that GET.
    response = await request(fetchImpl, url.href, { method: 'GET' }, signal);
  }
  if (!response.ok) {
    await response.body?.cancel();
    fail('UPSTREAM_UNAVAILABLE', 503);
  }
  return responseJson(response, METADATA_LIMIT, signal);
}

function metadata(raw) {
  const p = raw.privacy;
  if (
    raw.ok !== true ||
    raw.schemaVersion !== SCHEMA_VERSION ||
    raw.eventId !== EVENT_ID ||
    raw.authentication !== 'server-verified' ||
    typeof raw.accepting !== 'boolean' ||
    !date(raw.startAt) ||
    !date(raw.endAt) ||
    Date.parse(raw.startAt) >= Date.parse(raw.endAt) ||
    !nonempty(raw.rulesVersion, 100) ||
    !record(p) ||
    !nonempty(p.controller) ||
    !nonempty(p.contact) ||
    !nonempty(p.purpose, 4000) ||
    !Array.isArray(p.items) ||
    !p.items.length ||
    p.items.length > 30 ||
    !p.items.every((item) => nonempty(item)) ||
    !Number.isInteger(p.retentionDays) ||
    p.retentionDays < 1 ||
    p.retentionDays > 365
  ) {
    fail('NOT_ACCEPTING', 503);
  }
  return {
    ok: true,
    eventId: EVENT_ID,
    schemaVersion: SCHEMA_VERSION,
    authentication: 'server-verified',
    accepting: raw.accepting,
    startAt: raw.startAt,
    endAt: raw.endAt,
    rulesVersion: raw.rulesVersion,
    privacy: {
      controller: p.controller,
      contact: p.contact,
      purpose: p.purpose,
      items: p.items,
      retentionDays: p.retentionDays,
    },
  };
}

function input(raw) {
  const keys = [
    'eventId',
    'schemaVersion',
    'submissionId',
    'name',
    'instagramId',
    'privacyConsent',
    'rulesConsent',
    'rulesVersion',
    'expectedMemberId',
  ];
  if (
    !record(raw) ||
    Object.keys(raw).some((key) => !keys.includes(key)) ||
    raw.eventId !== EVENT_ID ||
    raw.schemaVersion !== SCHEMA_VERSION ||
    typeof raw.submissionId !== 'string' ||
    !UUID.test(raw.submissionId) ||
    !nonempty(raw.name, 80) ||
    !nonempty(raw.instagramId, 31) ||
    raw.privacyConsent !== true ||
    raw.rulesConsent !== true ||
    !nonempty(raw.rulesVersion, 100) ||
    ('expectedMemberId' in raw &&
      memberId(raw.expectedMemberId) !== raw.expectedMemberId)
  ) {
    fail('INVALID_INPUT', 400);
  }
  const instagramId = raw.instagramId.trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/.test(instagramId)) fail('INVALID_INPUT', 400);
  return {
    eventId: EVENT_ID,
    schemaVersion: SCHEMA_VERSION,
    submissionId: raw.submissionId.toLowerCase(),
    name: raw.name.trim(),
    instagramId,
    privacyConsent: true,
    rulesConsent: true,
    rulesVersion: raw.rulesVersion.trim(),
    expectedMemberId: raw.expectedMemberId,
  };
}

function tokenFrom(headers) {
  const value = headers.authorization;
  if (
    typeof value !== 'string' ||
    value.length > 8192 ||
    !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)
  ) {
    fail('LOGIN_REQUIRED', 401);
  }
  return value.slice(7);
}

async function apiJson(config, fetchImpl, pathname, token, signal) {
  // The API origin is operator-configured, never derived from browser input.
  // Redirects are not followed, preventing Authorization leaks to other hosts.
  const response = await request(
    fetchImpl,
    `${config.apiOrigin}${pathname}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    },
    signal,
  );
  if (!response.ok) {
    await response.body?.cancel();
    fail(
      [401, 403].includes(response.status)
        ? 'LOGIN_REQUIRED'
        : 'UPSTREAM_UNAVAILABLE',
      [401, 403].includes(response.status) ? 401 : 503,
    );
  }
  const raw = await responseJson(response, API_LIMIT, signal);
  if (
    raw.code !== 'C000' ||
    typeof raw.message !== 'string' ||
    !record(raw.data)
  ) {
    fail('INVALID_UPSTREAM_RESPONSE', 502);
  }
  return raw.data;
}

async function verifyMember(config, fetchImpl, token, signal) {
  const data = await apiJson(
    config,
    fetchImpl,
    '/api/v1/members/me',
    token,
    signal,
  );
  const nullableString = (value) => value === null || typeof value === 'string';
  if (
    !nullableString(data.nickname) ||
    !nullableString(data.profileImageUrl) ||
    !nullableString(data.desireTradeLocation) ||
    !nullableString(data.name ?? data.oauthUsername ?? null)
  ) {
    fail('INVALID_UPSTREAM_RESPONSE', 502);
  }
  // Decode only AFTER the existing authenticated API accepts this exact token.
  // Decoding is not signature verification; the API owns that responsibility.
  let id;
  try {
    id = memberId(
      JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
        .memberId,
    );
  } catch {
    fail('LOGIN_REQUIRED', 401);
  }
  if (!id || ('memberId' in data && memberId(data.memberId) !== id))
    fail('LOGIN_REQUIRED', 401);
  return id;
}

async function collectTrades(config, fetchImpl, token, id, signal) {
  const ids = new Set();
  let first;
  for (let pageNumber = 0; pageNumber < MAX_TRADES; pageNumber += 1) {
    signal.throwIfAborted();
    const page = await apiJson(
      config,
      fetchImpl,
      `/api/v1/trades/me?page=${pageNumber}&size=${PAGE_SIZE}`,
      token,
      signal,
    );
    if (
      !Array.isArray(page.content) ||
      page.number !== pageNumber ||
      !integer(page.size) ||
      page.size === 0 ||
      page.size > PAGE_SIZE ||
      page.content.length > page.size ||
      (page.last !== undefined && typeof page.last !== 'boolean')
    )
      fail('INVALID_UPSTREAM_RESPONSE', 502);
    const hasTotals =
      page.totalPages !== undefined || page.totalElements !== undefined;
    if (
      hasTotals &&
      (!integer(page.totalPages) ||
        !integer(page.totalElements) ||
        page.totalElements > MAX_TRADES ||
        page.totalPages !== Math.ceil(page.totalElements / page.size) ||
        pageNumber >= Math.max(page.totalPages, 1))
    )
      fail('INVALID_UPSTREAM_RESPONSE', 502);
    if (!hasTotals && typeof page.last !== 'boolean')
      fail('INVALID_UPSTREAM_RESPONSE', 502);
    const last = hasTotals ? pageNumber + 1 >= page.totalPages : page.last;
    if (
      (page.last !== undefined && last !== page.last) ||
      (!last && !page.content.length)
    )
      fail('INVALID_UPSTREAM_RESPONSE', 502);
    if (
      first &&
      (first.size !== page.size ||
        first.totalPages !== page.totalPages ||
        first.totalElements !== page.totalElements)
    )
      fail('INVALID_UPSTREAM_RESPONSE', 502);
    first ??= page;
    const count = ids.size;
    for (const trade of page.content) {
      if (
        !record(trade) ||
        !integer(trade.tradeId) ||
        trade.tradeId === 0 ||
        memberId(trade.memberId) !== id
      )
        fail('INVALID_UPSTREAM_RESPONSE', 502);
      ids.add(trade.tradeId);
    }
    if (ids.size > MAX_TRADES || (!last && ids.size === count))
      fail('INVALID_UPSTREAM_RESPONSE', 502);
    if (last) {
      if (hasTotals && ids.size !== page.totalElements)
        fail('INVALID_UPSTREAM_RESPONSE', 502);
      if (!ids.size) fail('PARTICIPATION_REQUIRED', 422);
      return [...ids].sort((a, b) => a - b);
    }
  }
  fail('INVALID_UPSTREAM_RESPONSE', 502);
}

function checkReady(data, rulesVersion, now) {
  if (
    !data.accepting ||
    now < Date.parse(data.startAt) ||
    now >= Date.parse(data.endAt)
  )
    fail('NOT_ACCEPTING', 409);
  if (data.rulesVersion !== rulesVersion) fail('POLICY_CHANGED', 409);
}

async function submit(config, fetchImpl, raw, token, signal, now) {
  const entry = input(raw);
  const settings = metadata(
    await googleJson(config, fetchImpl, { method: 'GET' }, signal),
  );
  checkReady(settings, entry.rulesVersion, now());
  const id = await verifyMember(config, fetchImpl, token, signal);
  if (entry.expectedMemberId && entry.expectedMemberId !== id)
    fail('MEMBER_MISMATCH', 409);
  const tradeIds = await collectTrades(config, fetchImpl, token, id, signal);
  checkReady(settings, entry.rulesVersion, now());
  // Deliberate field allowlist: credentials and browser-supplied identity are
  // never forwarded to Google, logged, or persisted by the relay.
  const payload = JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    eventId: EVENT_ID,
    submissionId: entry.submissionId,
    memberId: id,
    tradeIds,
    name: entry.name,
    instagramId: entry.instagramId,
    privacyConsent: true,
    rulesConsent: true,
    rulesVersion: entry.rulesVersion,
  });
  const timestamp = now();
  const signature = createHmac('sha256', config.secret)
    .update(`${timestamp}\n${payload}`)
    .digest('hex');
  const result = await googleJson(
    config,
    fetchImpl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ payload, timestamp, signature }),
    },
    signal,
  );
  if (result.ok !== true) {
    const codes = new Set([
      'NOT_ACCEPTING',
      'POLICY_CHANGED',
      'SUBMISSION_CONFLICT',
      'CAPACITY_REACHED',
    ]);
    fail(codes.has(result.code) ? result.code : 'RECEIPT_UNCONFIRMED', 409);
  }
  if (
    result.eventId !== EVENT_ID ||
    result.submissionId !== entry.submissionId ||
    !date(result.receivedAt)
  ) {
    fail('RECEIPT_UNCONFIRMED', 502);
  }
  return {
    ok: true,
    eventId: EVENT_ID,
    submissionId: entry.submissionId,
    receivedAt: result.receivedAt,
  };
}

function send(response, status, body) {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  response.end(JSON.stringify(body));
}

export function createRelayServer(
  config,
  { fetchImpl = globalThis.fetch, now = Date.now } = {},
) {
  let active = 0;
  const server = createServer({ maxHeaderSize: 16384 }, async (req, res) => {
    let counted = false;
    let timer;
    const controller = new AbortController();
    const abort = () =>
      controller.abort(new RelayError('REQUEST_ABORTED', 499));
    const disconnected = () => {
      if (!res.writableEnded) abort();
    };
    req.once('aborted', abort);
    res.once('close', disconnected);
    try {
      if (req.url !== EVENT_PATH) fail('NOT_FOUND', 404);
      if (!['GET', 'POST'].includes(req.method))
        fail('METHOD_NOT_ALLOWED', 405);
      if (
        (req.headers.origin && req.headers.origin !== config.frontendOrigin) ||
        (req.headers['sec-fetch-site'] &&
          req.headers['sec-fetch-site'] !== 'same-origin')
      )
        fail('ORIGIN_REJECTED', 403);
      if (req.method === 'POST' && req.headers.origin !== config.frontendOrigin)
        fail('ORIGIN_REJECTED', 403);
      if (active >= config.maxConcurrent) fail('BUSY', 429);
      active += 1;
      counted = true;
      timer = setTimeout(() => {
        controller.abort(new RelayError('REQUEST_TIMEOUT', 504));
        send(res, 504, { ok: false, code: 'REQUEST_TIMEOUT' });
      }, config.requestTimeoutMs);
      const signal = controller.signal;
      let result;
      if (req.method === 'GET') {
        result = metadata(
          await googleJson(config, fetchImpl, { method: 'GET' }, signal),
        );
      } else {
        if (
          !/^application\/json(?:;\s*charset=utf-8)?$/i.test(
            req.headers['content-type'] || '',
          ) ||
          req.headers['content-encoding']
        )
          fail('UNSUPPORTED_CONTENT_TYPE', 415);
        if (Number(req.headers['content-length']) > INPUT_LIMIT)
          fail('BODY_TOO_LARGE', 413);
        const token = tokenFrom(req.headers);
        let raw;
        try {
          raw = JSON.parse(await inputText(req, signal));
        } catch (error) {
          if (error instanceof RelayError) throw error;
          fail('INVALID_INPUT', 400);
        }
        result = await submit(config, fetchImpl, raw, token, signal, now);
      }
      signal.throwIfAborted();
      send(res, 200, result);
    } catch (error) {
      const safe = controller.signal.aborted ? controller.signal.reason : error;
      send(res, safe instanceof RelayError ? safe.status : 503, {
        ok: false,
        code: safe instanceof RelayError ? safe.code : 'UPSTREAM_UNAVAILABLE',
      });
    } finally {
      clearTimeout(timer);
      if (counted) active -= 1;
      req.off('aborted', abort);
      res.off('close', disconnected);
    }
  });
  server.requestTimeout = config.requestTimeoutMs;
  server.headersTimeout = Math.min(10000, config.requestTimeoutMs);
  server.keepAliveTimeout = 5000;
  server.maxRequestsPerSocket = 100;
  server.maxConnections = config.maxConcurrent * 8;
  return server;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const config = loadConfig();
    const server = createRelayServer(config);
    server.listen(config.port, '127.0.0.1');
    server.on('error', () => {
      process.stderr.write('Event relay could not start.\n');
      process.exitCode = 1;
    });
    const shutdown = () => {
      server.close();
      setTimeout(() => server.closeAllConnections(), 5000).unref();
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  } catch {
    process.stderr.write('Event relay configuration invalid.\n');
    process.exitCode = 1;
  }
}
