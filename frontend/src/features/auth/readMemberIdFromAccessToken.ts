interface AccessTokenPayload {
  memberId?: unknown;
}

function decodeBase64Url(value: string): string {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;

  return globalThis.atob(
    normalizedValue.padEnd(value.length + paddingLength, '='),
  );
}

function parseMemberId(value: unknown): string | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  }

  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    return value;
  }

  return null;
}

export function readMemberIdFromAccessToken(
  accessToken: string,
): string | null {
  const [, encodedPayload] = accessToken.split('.');

  if (!encodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encodedPayload),
    ) as AccessTokenPayload;

    return parseMemberId(payload.memberId);
  } catch {
    return null;
  }
}
