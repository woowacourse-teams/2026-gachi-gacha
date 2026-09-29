import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Sentry from '@sentry/react';

import {
  captureHandledError,
  getReactRootErrorHandlers,
  initializeErrorMonitoring,
  setErrorMonitoringRoute,
  setErrorMonitoringUser,
} from './errorMonitoringClient';

jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
  isInitialized: jest.fn(),
  reactErrorHandler: jest.fn(),
  setTag: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn(),
}));

const mockedCaptureException = jest.mocked(Sentry.captureException);
const mockedInit = jest.mocked(Sentry.init);
const mockedIsInitialized = jest.mocked(Sentry.isInitialized);
const mockedReactErrorHandler = jest.mocked(Sentry.reactErrorHandler);
const mockedSetTag = jest.mocked(Sentry.setTag);
const mockedSetUser = jest.mocked(Sentry.setUser);
const mockedWithScope = jest.mocked(Sentry.withScope);

describe('Sentry 오류 수집 클라이언트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsInitialized.mockReturnValue(false);
  });

  it('비활성화 환경에서는 SDK를 초기화하지 않는다', () => {
    expect(
      initializeErrorMonitoring({
        dsn: '',
        enabled: false,
        environment: 'test',
        release: 'test-release',
      }),
    ).toBe(false);
    expect(mockedInit).not.toHaveBeenCalled();
  });

  it('활성화 환경에는 개인정보 최소 수집 정책과 릴리스 정보를 적용한다', () => {
    expect(
      initializeErrorMonitoring({
        dsn: 'https://public-key@example.ingest.sentry.io/1',
        enabled: true,
        environment: 'development',
        release: 'commit-sha',
      }),
    ).toBe(true);

    expect(mockedInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public-key@example.ingest.sentry.io/1',
        environment: 'development',
        release: 'commit-sha',
        sampleRate: 1,
        dataCollection: expect.objectContaining({
          cookies: false,
          httpBodies: [],
          httpHeaders: false,
          stackFrameVariables: false,
          urlQueryParams: false,
          userInfo: false,
        }),
      }),
    );
    expect(mockedSetTag).toHaveBeenCalledWith('app.environment', 'development');
    expect(mockedSetTag).toHaveBeenCalledWith('app.release', 'commit-sha');
  });

  it('내부 숫자 식별자만 사용자 컨텍스트에 연결한다', () => {
    mockedIsInitialized.mockReturnValue(true);

    setErrorMonitoringUser('42');
    setErrorMonitoringUser('member-42');
    setErrorMonitoringUser(null);

    expect(mockedSetUser).toHaveBeenNthCalledWith(1, { id: '42' });
    expect(mockedSetUser).toHaveBeenNthCalledWith(2, null);
    expect(mockedSetUser).toHaveBeenNthCalledWith(3, null);
  });

  it('현재 경로와 처리된 오류의 기능 컨텍스트를 기록한다', () => {
    const setLevel = jest.fn();
    const setTag = jest.fn();
    const scope = { setLevel, setTag } as unknown as Sentry.Scope;

    mockedIsInitialized.mockReturnValue(true);
    mockedWithScope.mockImplementation(((
      callback: (currentScope: Sentry.Scope) => unknown,
    ) => callback(scope)) as never);

    setErrorMonitoringRoute('/mypage');
    captureHandledError(new Error('회원 조회 실패'), {
      feature: 'auth',
      operation: 'restore_session',
      level: 'warning',
    });

    expect(mockedSetTag).toHaveBeenCalledWith('route', '/mypage');
    expect(setLevel).toHaveBeenCalledWith('warning');
    expect(setTag).toHaveBeenCalledWith('error.handled', 'true');
    expect(setTag).toHaveBeenCalledWith('feature', 'auth');
    expect(setTag).toHaveBeenCalledWith('operation', 'restore_session');
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
  });

  it('Sentry가 활성화된 경우에만 React 19 루트 오류 핸들러를 제공한다', () => {
    const handler = jest.fn();
    mockedReactErrorHandler.mockReturnValue(handler);

    expect(getReactRootErrorHandlers()).toBeUndefined();

    mockedIsInitialized.mockReturnValue(true);

    const errorHandlers = getReactRootErrorHandlers();
    const error = new Error('React 루트 오류');

    errorHandlers?.onRecoverableError?.(error, {});
    errorHandlers?.onUncaughtError?.(error, {});

    expect(mockedReactErrorHandler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenNthCalledWith(1, error, { componentStack: null });
    expect(handler).toHaveBeenNthCalledWith(2, error, { componentStack: null });
  });
});
