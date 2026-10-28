import type { AuthTokens } from './authTokensType';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: '소셜 로그인이 취소되었거나 실패했습니다.',
  invalid_state: '로그인 요청이 유효하지 않습니다. 다시 시도해주세요.',
  login_failed: '소셜 로그인을 완료하지 못했습니다. 다시 시도해주세요.',
};

export function parseOAuthLoginFragment(fragment: string): AuthTokens {
  const params = new URLSearchParams(fragment.replace(/^#/, ''));
  const error = params.get('error');

  if (error) {
    throw new Error(
      OAUTH_ERROR_MESSAGES[error] ?? '소셜 로그인을 완료하지 못했습니다.',
    );
  }

  const accessToken = params.get('accessToken')?.trim();
  const refreshToken = params.get('refreshToken')?.trim();

  if (!accessToken || !refreshToken) {
    throw new Error('소셜 로그인 결과가 올바르지 않습니다. 다시 시도해주세요.');
  }

  return { accessToken, refreshToken };
}
