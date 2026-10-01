import type { Breadcrumb, ErrorEvent } from '@sentry/react';

const FILTERED_VALUE = '[Filtered]';
const SENSITIVE_KEY_PATTERN =
  /auth|cookie|credential|password|secret|token|code|state|content|description|body|chat|inquiry/i;
const BEARER_TOKEN_PATTERN = /(bearer\s+)[^\s,;]+/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*\b/g;
const SENSITIVE_QUERY_PATTERN =
  /([?&](?:code|state|token|access_token|refresh_token)=)[^&#\s]*/gi;

function redactSensitiveText(value: string): string {
  return value
    .replace(BEARER_TOKEN_PATTERN, `$1${FILTERED_VALUE}`)
    .replace(JWT_PATTERN, FILTERED_VALUE)
    .replace(SENSITIVE_QUERY_PATTERN, `$1${FILTERED_VALUE}`);
}

function stripUrlQueryAndHash(value: string): string {
  const queryIndex = value.indexOf('?');
  const hashIndex = value.indexOf('#');
  const indexes = [queryIndex, hashIndex].filter((index) => index >= 0);

  if (indexes.length === 0) {
    return value;
  }

  return value.slice(0, Math.min(...indexes));
}

function sanitizeValue(value: unknown, key = '', depth = 0): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return FILTERED_VALUE;
  }

  if (typeof value === 'string') {
    return redactSensitiveText(value);
  }

  if (depth >= 5 || value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, '', depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeValue(entryValue, entryKey, depth + 1),
    ]),
  );
}

export function sanitizeErrorBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const sanitizedBreadcrumb = { ...breadcrumb };

  if (breadcrumb.data) {
    const sanitizedData = sanitizeValue(breadcrumb.data) as Record<
      string,
      unknown
    >;

    for (const urlKey of ['url', 'from', 'to']) {
      const urlValue = sanitizedData[urlKey];

      if (typeof urlValue === 'string') {
        sanitizedData[urlKey] = stripUrlQueryAndHash(urlValue);
      }
    }

    sanitizedBreadcrumb.data = sanitizedData;
  }

  if (typeof breadcrumb.message === 'string') {
    sanitizedBreadcrumb.message = redactSensitiveText(breadcrumb.message);
  }

  return sanitizedBreadcrumb;
}

export function sanitizeErrorEvent(event: ErrorEvent): ErrorEvent {
  const sanitizedEvent = { ...event };

  if (typeof event.message === 'string') {
    sanitizedEvent.message = redactSensitiveText(event.message);
  }

  if (event.exception) {
    sanitizedEvent.exception = sanitizeValue(event.exception) as NonNullable<
      ErrorEvent['exception']
    >;
  }

  if (event.logentry) {
    sanitizedEvent.logentry = sanitizeValue(event.logentry) as NonNullable<
      ErrorEvent['logentry']
    >;
  }

  if (event.tags) {
    sanitizedEvent.tags = sanitizeValue(event.tags) as NonNullable<
      ErrorEvent['tags']
    >;
  }

  if (event.request) {
    const sanitizedRequest = { ...event.request };

    delete sanitizedRequest.cookies;
    delete sanitizedRequest.data;
    delete sanitizedRequest.headers;
    delete sanitizedRequest.query_string;

    if (sanitizedRequest.url) {
      sanitizedRequest.url = stripUrlQueryAndHash(sanitizedRequest.url);
    }

    sanitizedEvent.request = sanitizedRequest;
  }

  const userId = event.user?.id;

  if (event.breadcrumbs) {
    sanitizedEvent.breadcrumbs = event.breadcrumbs.map(sanitizeErrorBreadcrumb);
  }

  if (event.contexts) {
    sanitizedEvent.contexts = sanitizeValue(event.contexts) as NonNullable<
      ErrorEvent['contexts']
    >;
  }

  if (event.extra) {
    sanitizedEvent.extra = sanitizeValue(event.extra) as NonNullable<
      ErrorEvent['extra']
    >;
  }

  if (sanitizedEvent.transaction) {
    sanitizedEvent.transaction = stripUrlQueryAndHash(
      sanitizedEvent.transaction,
    );
  }

  if (userId) {
    sanitizedEvent.user = { id: String(userId) };
  } else {
    delete sanitizedEvent.user;
  }

  return sanitizedEvent;
}
