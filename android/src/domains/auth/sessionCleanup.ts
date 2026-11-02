import type { AuthTokens } from './authTypes';

export type AndroidSessionCleanupDependencies = {
  clearAuthTokens: () => Promise<void>;
  clearStoredPushToken: () => Promise<void>;
  logoutRemoteSession: (refreshToken: string) => Promise<void>;
  onLocalSessionCleared: () => void;
  readAuthTokens: () => Promise<AuthTokens | null>;
  readStoredPushToken: () => Promise<string | null>;
  unregisterRemotePushToken: (
    accessToken: string,
    pushToken: string,
  ) => Promise<void>;
};

async function readCleanupTargets(
  dependencies: AndroidSessionCleanupDependencies,
): Promise<{ pushToken: string | null; tokens: AuthTokens | null }> {
  const [tokensResult, pushTokenResult] = await Promise.allSettled([
    dependencies.readAuthTokens(),
    dependencies.readStoredPushToken(),
  ]);

  return {
    tokens: tokensResult.status === 'fulfilled' ? tokensResult.value : null,
    pushToken:
      pushTokenResult.status === 'fulfilled' ? pushTokenResult.value : null,
  };
}

/**
 * 로그아웃과 회원 탈퇴 후 세션 제거의 공통 경계다.
 *
 * 네트워크 요청이 지연되거나, 탈퇴 완료 뒤 인증이 무효화되어 실패하더라도
 * SecureStore와 화면 상태가 남지 않도록 로컬 정리를 항상 먼저 끝낸다.
 */
export async function cleanupAndroidSession(
  dependencies: AndroidSessionCleanupDependencies,
): Promise<void> {
  const { pushToken, tokens } = await readCleanupTargets(dependencies);

  await Promise.allSettled([
    dependencies.clearAuthTokens(),
    dependencies.clearStoredPushToken(),
  ]);
  dependencies.onLocalSessionCleared();

  const remoteCleanupTasks: Promise<void>[] = [];

  if (tokens && pushToken) {
    remoteCleanupTasks.push(
      dependencies.unregisterRemotePushToken(tokens.accessToken, pushToken),
    );
  }

  if (tokens) {
    remoteCleanupTasks.push(
      dependencies.logoutRemoteSession(tokens.refreshToken),
    );
  }

  await Promise.allSettled(remoteCleanupTasks);
}
