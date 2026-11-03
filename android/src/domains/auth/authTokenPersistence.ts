import type { AuthTokens } from './authTypes';

type TokenPersistence = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

function normalizeTokens(tokens: AuthTokens): AuthTokens {
  const accessToken = tokens.accessToken.trim();
  const refreshToken = tokens.refreshToken.trim();
  if (!accessToken || !refreshToken) {
    throw new Error('저장할 로그인 정보가 올바르지 않습니다.');
  }
  return { accessToken, refreshToken };
}

function parseTokens(value: string | null): AuthTokens | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !parsed || typeof parsed !== 'object' ||
      !('accessToken' in parsed) || typeof parsed.accessToken !== 'string' ||
      !('refreshToken' in parsed) || typeof parsed.refreshToken !== 'string'
    ) return null;
    return normalizeTokens({ accessToken: parsed.accessToken, refreshToken: parsed.refreshToken });
  } catch {
    return null;
  }
}

/** SecureStore의 읽기/쓰기/삭제 순서를 보장하고 완료된 전체 세션만 알린다. */
export function createAuthTokenPersistence(persistence: TokenPersistence) {
  let pending: Promise<unknown> = Promise.resolve();
  const listeners = new Set<(tokens: AuthTokens | null) => void>();

  const serial = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = pending.then(operation);
    pending = result.catch(() => undefined);
    return result;
  };
  const notify = (tokens: AuthTokens | null) => {
    for (const listener of listeners) {
      try { listener(tokens ? { ...tokens } : null); } catch {}
    }
  };
  const write = async (tokens: AuthTokens) => {
    const current = parseTokens(await persistence.read());
    if (
      current?.accessToken === tokens.accessToken &&
      current.refreshToken === tokens.refreshToken
    ) return;
    await persistence.write(JSON.stringify(tokens));
    notify(tokens);
  };

  return {
    read: () => serial(async () => {
      const stored = await persistence.read();
      const tokens = parseTokens(stored);
      if (stored && !tokens) {
        await persistence.remove();
        notify(null);
      }
      return tokens;
    }),
    store: (tokens: AuthTokens) => serial(() => write(normalizeTokens(tokens))),
    updateRefreshToken: (refreshToken: string) => serial(async () => {
      const current = parseTokens(await persistence.read());
      if (current && refreshToken.trim()) {
        await write({ ...current, refreshToken: refreshToken.trim() });
      }
    }),
    clear: () => serial(async () => {
      await persistence.remove();
      notify(null);
    }),
    subscribe(listener: (tokens: AuthTokens | null) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
