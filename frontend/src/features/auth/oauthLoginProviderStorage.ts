import { isOAuthProvider, type OAuthProvider } from './oauthProviderType';

const STORAGE_KEY = 'gachi-gacha:oauth-login-provider';

export function storeOAuthLoginProvider(provider: OAuthProvider): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, provider);
  } catch {
    // 저장소가 제한된 환경에서는 제공자 분석 정보만 생략합니다.
  }
}

export function readOAuthLoginProvider(): OAuthProvider | null {
  try {
    const provider = window.sessionStorage.getItem(STORAGE_KEY);

    return provider && isOAuthProvider(provider) ? provider : null;
  } catch {
    return null;
  }
}

export function clearOAuthLoginProvider(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소가 제한된 환경에서는 정리할 값이 없습니다.
  }
}
