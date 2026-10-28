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

  it('활성화 시 개인정보 최소 수집 정책과 릴리스를 적용한다', () => {
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
        environment: 'development',
        release: 'commit-sha',
        sendDefaultPii: false,
        dataCollection: expect.objectContaining({
          cookies: false,
          httpBodies: [],
          httpHeaders: false,
          urlQueryParams: false,
          userInfo: false,
        }),
      }),
    );
  });

  it('숫자형 내부 식별자만 사용자 컨텍스트에 연결한다', () => {
    mockedIsInitialized.mockReturnValue(true);
    setErrorMonitoringUser('42');
    setErrorMonitoringUser('member-42');
    expect(mockedSetUser).toHaveBeenNthCalledWith(1, { id: '42' });
    expect(mockedSetUser).toHaveBeenNthCalledWith(2, null);
  });

  it('경로와 선택적으로 처리된 오류의 기능 문맥을 기록한다', () => {
    const scope = {
      setLevel: jest.fn(),
      setTag: jest.fn(),
    } as unknown as Sentry.Scope;
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
    expect(scope.setTag).toHaveBeenCalledWith('feature', 'auth');
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
  });

  it('활성화된 경우에만 React 루트 오류 핸들러를 제공한다', () => {
    const handler = jest.fn();
    mockedReactErrorHandler.mockReturnValue(handler);
    expect(getReactRootErrorHandlers()).toBeUndefined();
    mockedIsInitialized.mockReturnValue(true);
    const handlers = getReactRootErrorHandlers();
    const error = new Error('React 루트 오류');
    handlers?.onRecoverableError?.(error, {});
    handlers?.onUncaughtError?.(error, {});
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
