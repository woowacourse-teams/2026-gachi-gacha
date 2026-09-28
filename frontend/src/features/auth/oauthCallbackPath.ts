import { isOAuthProvider, type OAuthProvider } from './oauthProviderType';

export const OAUTH_CALLBACK_PATH_PREFIX = '/oauth/login';

export function parseOAuthCallbackProvider(
  pathname: string,
): OAuthProvider | null {
  const pathPrefix = `${OAUTH_CALLBACK_PATH_PREFIX}/`;

  if (!pathname.startsWith(pathPrefix)) {
    return null;
  }

  const provider = pathname.slice(pathPrefix.length);

  return provider && !provider.includes('/') && isOAuthProvider(provider)
    ? provider
    : null;
}

export function isOAuthCallbackPath(pathname: string): boolean {
  return (
    pathname === OAUTH_CALLBACK_PATH_PREFIX ||
    pathname.startsWith(`${OAUTH_CALLBACK_PATH_PREFIX}/`)
  );
}
