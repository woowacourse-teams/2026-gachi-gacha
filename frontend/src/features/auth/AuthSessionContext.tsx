import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { AuthApiError } from './api/AuthApiError';
import { subscribeToAuthenticationExpired } from './api/authenticatedFetch';
import { getCurrentMember } from './api/getCurrentMember';
import type { AuthMember } from './authMemberType';
import {
  clearAccessToken,
  readAccessToken,
  storeAccessToken,
} from './authTokenStorage';

type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'error';

interface AuthSessionValue {
  status: AuthStatus;
  member: AuthMember | null;
  errorMessage: string | null;
  authenticate: (accessToken: string) => Promise<void>;
  logout: () => void;
  retry: () => void;
}

interface AuthState {
  status: AuthStatus;
  member: AuthMember | null;
  errorMessage: string | null;
}

const GUEST_STATE: AuthState = {
  status: 'guest',
  member: null,
  errorMessage: null,
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function getInitialState(): AuthState {
  return readAccessToken()
    ? { status: 'loading', member: null, errorMessage: null }
    : GUEST_STATE;
}

export interface AuthSessionProviderProps {
  children: ReactNode;
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [state, setState] = useState<AuthState>(getInitialState);

  const restoreSession = useCallback(async (signal?: AbortSignal) => {
    const accessToken = readAccessToken();

    if (!accessToken) {
      setState(GUEST_STATE);
      return;
    }

    setState({ status: 'loading', member: null, errorMessage: null });

    try {
      const member = await getCurrentMember(accessToken, signal);
      setState({ status: 'authenticated', member, errorMessage: null });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      if (error instanceof AuthApiError && error.status === 401) {
        clearAccessToken();
        setState(GUEST_STATE);
        return;
      }

      setState({
        status: 'error',
        member: null,
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

    return () => {
      controller.abort();
    };
  }, [restoreSession]);

  useEffect(
    () =>
      subscribeToAuthenticationExpired(() => {
        setState(GUEST_STATE);
      }),
    [],
  );

  const authenticate = useCallback(async (accessToken: string) => {
    const normalizedToken = accessToken.trim();

    if (!normalizedToken) {
      throw new Error('로그인 토큰이 없습니다.');
    }

    setState({ status: 'loading', member: null, errorMessage: null });

    try {
      const member = await getCurrentMember(normalizedToken);
      storeAccessToken(normalizedToken);
      setState({ status: 'authenticated', member, errorMessage: null });
    } catch (error) {
      clearAccessToken();
      setState({
        status: 'error',
        member: null,
        errorMessage:
          error instanceof Error ? error.message : '로그인에 실패했습니다.',
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setState(GUEST_STATE);
  }, []);

  const retry = useCallback(() => {
    void restoreSession();
  }, [restoreSession]);

  const value = useMemo<AuthSessionValue>(
    () => ({
      ...state,
      authenticate,
      logout,
      retry,
    }),
    [authenticate, logout, retry, state],
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
    throw new Error(
      'useAuthSession은 AuthSessionProvider 안에서 사용해야 합니다.',
    );
  }

  return value;
}
