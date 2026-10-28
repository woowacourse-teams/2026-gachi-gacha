import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCurrentMember,
  isUnauthorizedAuthError,
  logoutAuthSession,
  refreshAuthTokensOnce,
  subscribeToAuthenticationExpired,
  updateCurrentMember,
} from './authApi';
import { clearAuthTokens, readAuthTokens, storeAuthTokens } from './authTokenStorage';
import type {
  AuthMember,
  AuthStatus,
  AuthTokens,
  UpdateAuthMemberInput,
} from './authTypes';

interface AuthSessionState {
  status: AuthStatus;
  member: AuthMember | null;
  memberId: number | null;
  errorMessage: string | null;
}

interface AuthSessionValue extends AuthSessionState {
  authenticate: (tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
  updateProfile: (input: UpdateAuthMemberInput) => Promise<void>;
}

const GUEST_STATE: AuthSessionState = {
  status: 'guest',
  member: null,
  memberId: null,
  errorMessage: null,
};

const LOADING_STATE: AuthSessionState = {
  status: 'loading',
  member: null,
  memberId: null,
  errorMessage: null,
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

function readMemberId(accessToken: string): number | null {
  try {
    const encodedPayload = accessToken.split('.')[1];

    if (!encodedPayload) {
      return null;
    }

    const normalizedPayload = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
    const payload: unknown = JSON.parse(atob(normalizedPayload));

    if (typeof payload !== 'object' || payload === null || !('memberId' in payload)) {
      return null;
    }

    const memberId = Number(payload.memberId);
    return Number.isSafeInteger(memberId) && memberId > 0 ? memberId : null;
  } catch {
    return null;
  }
}

function createAuthenticatedState(
  member: AuthMember,
  accessToken: string,
): AuthSessionState {
  return {
    status: 'authenticated',
    member,
    memberId: readMemberId(accessToken),
    errorMessage: null,
  };
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthSessionState>(LOADING_STATE);

  const restoreSession = useCallback(async (signal?: AbortSignal) => {
    setState(LOADING_STATE);

    try {
      let tokens = await readAuthTokens();

      if (!tokens) {
        setState(GUEST_STATE);
        return;
      }

      try {
        const member = await getCurrentMember(tokens.accessToken, signal);
        setState(createAuthenticatedState(member, tokens.accessToken));
        return;
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        if (!isUnauthorizedAuthError(error)) {
          throw error;
        }
      }

      tokens = await refreshAuthTokensOnce(tokens.refreshToken);

      if (signal?.aborted) {
        return;
      }

      await storeAuthTokens(tokens);
      const member = await getCurrentMember(tokens.accessToken, signal);
      setState(createAuthenticatedState(member, tokens.accessToken));
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      if (isUnauthorizedAuthError(error)) {
        await clearAuthTokens();
        setState(GUEST_STATE);
        return;
      }

      setState({
        status: 'error',
        member: null,
        memberId: null,
        errorMessage:
          error instanceof Error
            ? error.message
            : '로그인 상태를 확인하지 못했습니다.',
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void restoreSession(controller.signal);

    return () => controller.abort();
  }, [restoreSession]);

  useEffect(
    () =>
      subscribeToAuthenticationExpired(() => {
        setState(GUEST_STATE);
      }),
    [],
  );

  const authenticate = useCallback(async (tokens: AuthTokens) => {
    setState(LOADING_STATE);

    try {
      const member = await getCurrentMember(tokens.accessToken);
      await storeAuthTokens(tokens);
      setState(createAuthenticatedState(member, tokens.accessToken));
    } catch (error) {
      await clearAuthTokens();
      setState({
        status: 'error',
        member: null,
        memberId: null,
        errorMessage: error instanceof Error ? error.message : '로그인에 실패했습니다.',
      });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const tokens = await readAuthTokens();
    await clearAuthTokens();
    setState(GUEST_STATE);

    if (tokens) {
      await logoutAuthSession(tokens.refreshToken).catch(() => undefined);
    }
  }, []);

  const retry = useCallback(() => {
    void restoreSession();
  }, [restoreSession]);

  const updateProfile = useCallback(async (input: UpdateAuthMemberInput) => {
    const member = await updateCurrentMember(input);
    setState((current) => {
      if (current.status !== 'authenticated') return current;
      return { ...current, member };
    });
  }, []);

  const value = useMemo<AuthSessionValue>(
    () => ({ ...state, authenticate, logout, retry, updateProfile }),
    [authenticate, logout, retry, state, updateProfile],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionValue {
  const value = useContext(AuthSessionContext);

  if (!value) {
    throw new Error('useAuthSession은 AuthSessionProvider 안에서 사용해야 합니다.');
  }

  return value;
}
