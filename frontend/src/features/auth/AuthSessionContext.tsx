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
import { deleteCurrentMember } from './api/deleteCurrentMember';
import { getCurrentMember } from './api/getCurrentMember';
import { logoutAuthSession } from './api/logoutAuthSession';
import { refreshAuthTokensOnce } from './api/refreshAuthTokens';
import {
  updateCurrentMember,
  type UpdateCurrentMemberInput,
} from './api/updateCurrentMember';
import type { AuthMember } from './authMemberType';
import {
  clearAuthTokens,
  readAccessToken,
  readRefreshToken,
  storeAuthTokens,
} from './authTokenStorage';
import type { AuthTokens } from './authTokensType';

type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'error';

interface AuthSessionValue {
  status: AuthStatus;
  member: AuthMember | null;
  errorMessage: string | null;
  authenticate: (tokens: AuthTokens) => Promise<void>;
  updateProfile: (input: UpdateCurrentMemberInput) => Promise<void>;
  deleteAccount: () => Promise<void>;
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

export interface AuthSessionProviderProps {
  children: ReactNode;
  initialAccessToken?: string | null;
}

export function AuthSessionProvider({
  children,
  initialAccessToken,
}: AuthSessionProviderProps) {
  const readSessionAccessToken = useCallback(
    () =>
      initialAccessToken === undefined ? readAccessToken() : initialAccessToken,
    [initialAccessToken],
  );
  const [state, setState] = useState<AuthState>(() =>
    readSessionAccessToken() ||
    (initialAccessToken === undefined && readRefreshToken())
      ? { status: 'loading', member: null, errorMessage: null }
      : GUEST_STATE,
  );

  const restoreSession = useCallback(
    async (signal?: AbortSignal) => {
      let accessToken = readSessionAccessToken();
      const refreshToken =
        initialAccessToken === undefined ? readRefreshToken() : null;

      if (!accessToken && !refreshToken) {
        setState(GUEST_STATE);
        return;
      }

      setState({ status: 'loading', member: null, errorMessage: null });

      try {
        if (accessToken) {
          try {
            const member = await getCurrentMember(accessToken, signal);

            setState({ status: 'authenticated', member, errorMessage: null });
            return;
          } catch (error) {
            if (isAbortError(error)) {
              return;
            }

            if (!(error instanceof AuthApiError && error.status === 401)) {
              throw error;
            }
          }
        }

        if (!refreshToken) {
          clearAuthTokens();
          setState(GUEST_STATE);
          return;
        }

        let refreshedTokens: AuthTokens;

        try {
          refreshedTokens = await refreshAuthTokensOnce(refreshToken);
        } catch {
          if (signal?.aborted) {
            return;
          }

          clearAuthTokens();
          setState(GUEST_STATE);
          return;
        }

        if (signal?.aborted) {
          return;
        }

        const currentRefreshToken = readRefreshToken();

        if (
          currentRefreshToken !== refreshToken &&
          currentRefreshToken !== refreshedTokens.refreshToken
        ) {
          return;
        }

        storeAuthTokens(refreshedTokens);
        accessToken = refreshedTokens.accessToken;

        const member = await getCurrentMember(accessToken, signal);
        setState({ status: 'authenticated', member, errorMessage: null });
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        if (error instanceof AuthApiError && error.status === 401) {
          clearAuthTokens();
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
    },
    [initialAccessToken, readSessionAccessToken],
  );

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

  const authenticate = useCallback(async (tokens: AuthTokens) => {
    const accessToken = tokens.accessToken.trim();
    const refreshToken = tokens.refreshToken.trim();

    if (!accessToken || !refreshToken) {
      throw new Error('로그인 토큰 정보가 올바르지 않습니다.');
    }

    setState({ status: 'loading', member: null, errorMessage: null });

    try {
      const member = await getCurrentMember(accessToken);

      storeAuthTokens({ accessToken, refreshToken });
      setState({ status: 'authenticated', member, errorMessage: null });
    } catch (error) {
      clearAuthTokens();
      setState({
        status: 'error',
        member: null,
        errorMessage:
          error instanceof Error ? error.message : '로그인에 실패했습니다.',
      });
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (input: UpdateCurrentMemberInput) => {
    const updatedMember = await updateCurrentMember(input);

    setState((currentState) => ({
      status: 'authenticated',
      member: {
        ...updatedMember,
        name: updatedMember.name ?? currentState.member?.name ?? null,
      },
      errorMessage: null,
    }));
  }, []);

  const deleteAccount = useCallback(async () => {
    await deleteCurrentMember();
    clearAuthTokens();
    setState(GUEST_STATE);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = readRefreshToken();

    clearAuthTokens();
    setState(GUEST_STATE);

    if (refreshToken) {
      void logoutAuthSession(refreshToken).catch(() => undefined);
    }
  }, []);

  const retry = useCallback(() => {
    void restoreSession();
  }, [restoreSession]);

  const value = useMemo<AuthSessionValue>(
    () => ({
      ...state,
      authenticate,
      updateProfile,
      deleteAccount,
      logout,
      retry,
    }),
    [authenticate, deleteAccount, logout, retry, state, updateProfile],
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
