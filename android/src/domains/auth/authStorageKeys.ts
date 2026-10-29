export const AUTH_SESSION_KEY = 'gachi-gacha.auth-session.v1';
export const PENDING_OAUTH_LOGIN_KEY =
  'gachi-gacha.pending-oauth-login.v1';

const SECURE_STORE_KEY_PATTERN = /^[\w.-]+$/;

export function isValidSecureStoreKey(value: string): boolean {
  return SECURE_STORE_KEY_PATTERN.test(value);
}
