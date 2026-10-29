import { getApiBaseUrl } from '../../config/api';
import { AuthApiError, parseAuthTokens } from './authApi';
import type { AuthTokens, MobileOAuthProvider } from './authTypes';
import { traceMobileOAuth } from './oauthDiagnostics';

const JSON_CONTENT_TYPE = 'application/json';

type MobileOAuthNonce = {
  expiresInSeconds: number;
  nonce: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readApiMessage(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.message === 'string'
    ? value.message
    : fallback;
}

async function readJsonResponse(
  response: Response,
  fallbackMessage: string,
): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)) {
    throw new AuthApiError(fallbackMessage, response.status);
  }

  return response.json() as Promise<unknown>;
}

export async function issueMobileOAuthNonce(
  provider: MobileOAuthProvider,
): Promise<MobileOAuthNonce> {
  traceMobileOAuth(provider, 'nonce_request_started');
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/oauth/mobile/nonce/${provider}`,
    { headers: { Accept: JSON_CONTENT_TYPE } },
  );
  const body = await readJsonResponse(response, '로그인 요청을 준비하지 못했습니다.');

  if (!response.ok) {
    traceMobileOAuth(provider, 'nonce_request_failed', {
      httpStatus: response.status,
    });
    throw new AuthApiError(
      readApiMessage(body, '로그인 요청을 준비하지 못했습니다.'),
      response.status,
    );
  }

  if (
    !isRecord(body) ||
    body.code !== 'C000' ||
    !isRecord(body.data) ||
    typeof body.data.nonce !== 'string' ||
    !body.data.nonce.trim() ||
    typeof body.data.expiresInSeconds !== 'number' ||
    !Number.isFinite(body.data.expiresInSeconds) ||
    body.data.expiresInSeconds <= 0
  ) {
    throw new Error('로그인 nonce 응답 형식이 올바르지 않습니다.');
  }

  traceMobileOAuth(provider, 'nonce_request_succeeded', {
    expiresInSeconds: body.data.expiresInSeconds,
  });
  return {
    expiresInSeconds: body.data.expiresInSeconds,
    nonce: body.data.nonce.trim(),
  };
}

export async function exchangeMobileOAuthCode(
  provider: MobileOAuthProvider,
  input: {
    code: string;
    codeVerifier: string;
    nonce: string;
  },
): Promise<AuthTokens> {
  traceMobileOAuth(provider, 'token_exchange_started');
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/oauth/mobile/login/${provider}`,
    {
      method: 'POST',
      headers: {
        Accept: JSON_CONTENT_TYPE,
        'Content-Type': JSON_CONTENT_TYPE,
      },
      body: JSON.stringify(input),
    },
  );
  const body = await readJsonResponse(response, '소셜 로그인을 완료하지 못했습니다.');

  if (!response.ok) {
    traceMobileOAuth(provider, 'token_exchange_failed', {
      httpStatus: response.status,
    });
    throw new AuthApiError(
      readApiMessage(body, '소셜 로그인을 완료하지 못했습니다.'),
      response.status,
    );
  }

  const tokens = parseAuthTokens(body);
  traceMobileOAuth(provider, 'token_exchange_succeeded');
  return tokens;
}
