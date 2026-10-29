import type { MobileOAuthProvider } from './authTypes';

type OAuthDiagnosticValue = boolean | number | string;

export function traceMobileOAuth(
  provider: MobileOAuthProvider,
  stage: string,
  details: Readonly<Record<string, OAuthDiagnosticValue>> = {},
): void {
  if (!__DEV__) {
    return;
  }

  const fields = Object.entries(details)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' ');

  console.info(
    `[GachiGachaOAuth] provider=${provider} stage=${stage}${fields ? ` ${fields}` : ''}`,
  );
}
