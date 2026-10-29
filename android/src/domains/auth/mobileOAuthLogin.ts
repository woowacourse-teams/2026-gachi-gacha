import * as WebBrowser from 'expo-web-browser';

import { getMobileOAuthProviderConfig } from '../../config/oauth';
import type { AuthTokens, MobileOAuthProvider } from './authTypes';
import { exchangeMobileOAuthCode, issueMobileOAuthNonce } from './oauthApi';
import { traceMobileOAuth } from './oauthDiagnostics';
import {
  clearPendingOAuthLogin,
  readPendingOAuthLogin,
  storePendingOAuthLogin,
} from './oauthPendingLoginStorage';
import { createOAuthPkcePair } from './oauthPkce';

export type MobileOAuthLoginErrorCode =
  | 'cancelled'
  | 'expired'
  | 'invalid_callback'
  | 'not_configured'
  | 'provider_denied';

export class MobileOAuthLoginError extends Error {
  constructor(
    message: string,
    readonly code: MobileOAuthLoginErrorCode,
  ) {
    super(message);
    this.name = 'MobileOAuthLoginError';
  }
}

export function buildMobileOAuthAuthorizationUrl(input: {
  authorizationEndpoint: string;
  callbackUrl: string;
  challenge: string;
  clientId: string;
  nonce: string;
  scope: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    code_challenge: input.challenge,
    code_challenge_method: 'S256',
    nonce: input.nonce,
    redirect_uri: input.callbackUrl,
    response_type: 'code',
    scope: input.scope,
    state: input.nonce,
  });

  return `${input.authorizationEndpoint}?${params.toString()}`;
}

function readSingleParameter(url: URL, name: string): string | null {
  const values = url.searchParams.getAll(name);
  return values.length === 1 && values[0]?.trim() ? values[0].trim() : null;
}

async function exchangeStoredOAuthCallback(
  callbackUrl: string,
): Promise<AuthTokens> {
  const pending = await readPendingOAuthLogin();

  if (!pending) {
    throw new MobileOAuthLoginError(
      '로그인 요청이 만료되었습니다. 다시 시도해 주세요.',
      'expired',
    );
  }

  traceMobileOAuth(pending.provider, 'callback_received');

  let expectedCallback: URL;
  let callback: URL;

  try {
    expectedCallback = new URL(pending.callbackUrl);
    callback = new URL(callbackUrl);
  } catch {
    throw new MobileOAuthLoginError(
      '로그인 응답 주소가 올바르지 않습니다.',
      'invalid_callback',
    );
  }

  if (
    callback.protocol !== 'https:' ||
    callback.origin !== expectedCallback.origin ||
    callback.pathname !== expectedCallback.pathname ||
    callback.hash
  ) {
    throw new MobileOAuthLoginError(
      '요청하지 않은 로그인 응답을 받았습니다.',
      'invalid_callback',
    );
  }

  const returnedState = readSingleParameter(callback, 'state');

  if (returnedState !== pending.nonce) {
    throw new MobileOAuthLoginError(
      '로그인 요청을 확인할 수 없습니다. 다시 시도해 주세요.',
      'invalid_callback',
    );
  }

  const providerError = readSingleParameter(callback, 'error');

  if (providerError) {
    throw new MobileOAuthLoginError(
      providerError === 'access_denied'
        ? '소셜 로그인이 취소되었습니다.'
        : '소셜 로그인 제공자가 요청을 완료하지 못했습니다.',
      'provider_denied',
    );
  }

  const code = readSingleParameter(callback, 'code');

  if (!code) {
    throw new MobileOAuthLoginError(
      '로그인 응답에 인가 코드가 없습니다.',
      'invalid_callback',
    );
  }

  traceMobileOAuth(pending.provider, 'callback_validated');
  return exchangeMobileOAuthCode(pending.provider, {
    code,
    codeVerifier: pending.codeVerifier,
    nonce: pending.nonce,
  });
}

let pendingCallbackCompletion: Promise<AuthTokens> | null = null;

export function isConfiguredMobileOAuthCallbackUrl(value: string): boolean {
  let candidate: URL;

  try {
    candidate = new URL(value);
  } catch {
    return false;
  }

  return (['kakao', 'naver'] as const).some((provider) => {
    const config = getMobileOAuthProviderConfig(provider);

    if (!config) {
      return false;
    }

    const expected = new URL(config.callbackUrl);
    return (
      candidate.protocol === 'https:' &&
      candidate.origin === expected.origin &&
      candidate.pathname === expected.pathname
    );
  });
}

export function completeMobileOAuthCallback(
  callbackUrl: string,
): Promise<AuthTokens> {
  if (pendingCallbackCompletion) {
    return pendingCallbackCompletion;
  }

  const completion = exchangeStoredOAuthCallback(callbackUrl).finally(
    async () => {
      await clearPendingOAuthLogin();
      pendingCallbackCompletion = null;
    },
  );
  pendingCallbackCompletion = completion;
  return completion;
}

export async function loginWithMobileOAuth(
  provider: MobileOAuthProvider,
): Promise<AuthTokens> {
  const config = getMobileOAuthProviderConfig(provider);

  if (!config) {
    throw new MobileOAuthLoginError(
      '이 빌드에는 소셜 로그인 설정이 아직 연결되지 않았습니다.',
      'not_configured',
    );
  }

  traceMobileOAuth(provider, 'login_started');
  await clearPendingOAuthLogin();
  const [{ expiresInSeconds, nonce }, pkce] = await Promise.all([
    issueMobileOAuthNonce(provider),
    createOAuthPkcePair(),
  ]);
  const expiresAt = Date.now() + expiresInSeconds * 1_000;

  await storePendingOAuthLogin({
    callbackUrl: config.callbackUrl,
    codeVerifier: pkce.verifier,
    expiresAt,
    nonce,
    provider,
  });
  traceMobileOAuth(provider, 'pending_login_stored', {
    expiresInSeconds,
  });

  const authorizationUrl = buildMobileOAuthAuthorizationUrl({
    ...config,
    challenge: pkce.challenge,
    nonce,
  });

  try {
    traceMobileOAuth(provider, 'browser_opened');
    const result = await WebBrowser.openAuthSessionAsync(
      authorizationUrl,
      config.callbackUrl,
      {
        createTask: true,
        showInRecents: false,
        showTitle: false,
      },
    );

    if (result.type !== 'success') {
      traceMobileOAuth(provider, 'browser_cancelled', { result: result.type });
      throw new MobileOAuthLoginError(
        '소셜 로그인이 취소되었습니다.',
        'cancelled',
      );
    }

    return await completeMobileOAuthCallback(result.url);
  } catch (error) {
    traceMobileOAuth(provider, 'login_failed', {
      reason:
        error instanceof MobileOAuthLoginError ? error.code : 'unexpected',
    });
    await clearPendingOAuthLogin();
    throw error;
  }
}
