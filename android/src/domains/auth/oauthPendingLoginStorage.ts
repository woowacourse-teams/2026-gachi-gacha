import * as SecureStore from 'expo-secure-store';

import {
  isMobileOAuthProvider,
  type MobileOAuthProvider,
} from './authTypes';
import { PENDING_OAUTH_LOGIN_KEY } from './authStorageKeys';

export type PendingOAuthLogin = {
  callbackUrl: string;
  codeVerifier: string;
  expiresAt: number;
  nonce: string;
  provider: MobileOAuthProvider;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePendingOAuthLogin(value: string): PendingOAuthLogin | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (
      !isRecord(parsed) ||
      !isMobileOAuthProvider(parsed.provider) ||
      !isNonBlankString(parsed.nonce) ||
      !isNonBlankString(parsed.codeVerifier) ||
      !isNonBlankString(parsed.callbackUrl) ||
      typeof parsed.expiresAt !== 'number' ||
      !Number.isFinite(parsed.expiresAt)
    ) {
      return null;
    }

    return {
      callbackUrl: parsed.callbackUrl,
      codeVerifier: parsed.codeVerifier,
      expiresAt: parsed.expiresAt,
      nonce: parsed.nonce,
      provider: parsed.provider,
    };
  } catch {
    return null;
  }
}

export async function readPendingOAuthLogin(): Promise<PendingOAuthLogin | null> {
  const stored = await SecureStore.getItemAsync(PENDING_OAUTH_LOGIN_KEY);

  if (!stored) {
    return null;
  }

  const pending = parsePendingOAuthLogin(stored);

  if (!pending || pending.expiresAt <= Date.now()) {
    await clearPendingOAuthLogin();
    return null;
  }

  return pending;
}

export async function storePendingOAuthLogin(
  pending: PendingOAuthLogin,
): Promise<void> {
  await SecureStore.setItemAsync(PENDING_OAUTH_LOGIN_KEY, JSON.stringify(pending));
}

export async function clearPendingOAuthLogin(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_OAUTH_LOGIN_KEY);
}
