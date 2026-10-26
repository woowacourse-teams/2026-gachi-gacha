import * as SecureStore from 'expo-secure-store';

import type { AuthTokens } from './authTypes';

const AUTH_SESSION_KEY = 'gachi-gacha:auth-session:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeTokens(tokens: AuthTokens): AuthTokens {
  const accessToken = tokens.accessToken.trim();
  const refreshToken = tokens.refreshToken.trim();

  if (!accessToken || !refreshToken) {
    throw new Error('저장할 로그인 정보가 올바르지 않습니다.');
  }

  return { accessToken, refreshToken };
}

function parseStoredTokens(value: string): AuthTokens | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (
      !isRecord(parsed) ||
      !isNonBlankString(parsed.accessToken) ||
      !isNonBlankString(parsed.refreshToken)
    ) {
      return null;
    }

    return normalizeTokens({
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
    });
  } catch {
    return null;
  }
}

export async function readAuthTokens(): Promise<AuthTokens | null> {
  const storedSession = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  const tokens = parseStoredTokens(storedSession);

  if (!tokens) {
    await clearAuthTokens();
  }

  return tokens;
}

export async function storeAuthTokens(tokens: AuthTokens): Promise<void> {
  const normalizedTokens = normalizeTokens(tokens);

  await SecureStore.setItemAsync(
    AUTH_SESSION_KEY,
    JSON.stringify(normalizedTokens),
  );
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}
