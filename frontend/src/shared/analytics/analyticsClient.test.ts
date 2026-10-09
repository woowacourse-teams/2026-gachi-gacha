import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

const mockPosthogClient = {
  capture: jest.fn(),
  identify: jest.fn(),
  init: jest.fn(),
  register: jest.fn(),
  reset: jest.fn(),
};

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: mockPosthogClient,
}));

function setAnalyticsEnabled(enabled: boolean) {
  Object.defineProperty(globalThis, '__POSTHOG_ENABLED__', {
    configurable: true,
    value: enabled,
    writable: true,
  });
}

async function flushAnalyticsClient() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('analyticsClient', () => {
  beforeEach(() => {
    jest.resetModules();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
    setAnalyticsEnabled(true);
    mockPosthogClient.init.mockImplementation((...args: unknown[]) => {
      const options = args[1] as {
        loaded?: (client: typeof mockPosthogClient) => void;
      };

      options.loaded?.(mockPosthogClient);
    });
  });

  afterAll(() => {
    setAnalyticsEnabled(false);
  });

  it('이벤트 계약의 속성과 공통 분석 문맥을 전송한다', async () => {
    const { captureAnalyticsEvent } = await import('./analyticsClient');

    captureAnalyticsEvent('trade_search_submitted', { query_length: 4 });
    await flushAnalyticsClient();

    expect(mockPosthogClient.capture).toHaveBeenCalledWith(
      'trade_search_submitted',
      {
        analytics_schema_version: 1,
        app_version: 'test',
        environment: 'test',
        is_internal_user: false,
        query_length: 4,
      },
    );
  });

  it('OAuth 인증 정보가 포함된 URL은 전송 전에 민감 파라미터를 제거한다', async () => {
    const { initializeAnalytics } = await import('./analyticsClient');

    initializeAnalytics();
    await flushAnalyticsClient();

    const config = mockPosthogClient.init.mock.calls.at(-1)?.[1] as
      | {
          before_send?: (captureResult: {
            uuid: string;
            event: string;
            properties: Record<string, unknown>;
          }) => {
            properties: Record<string, unknown>;
          } | null;
        }
      | undefined;
    const sanitizedCapture = config?.before_send?.({
      uuid: 'event-id',
      event: '$pageview',
      properties: {
        $current_url:
          'https://gachigacha.kro.kr/oauth/login/kakao?code=secret&state=csrf&campaign=launch',
      },
    });

    expect(sanitizedCapture?.properties.$current_url).toBe(
      'https://gachigacha.kro.kr/oauth/login/kakao?campaign=launch',
    );
  });

  it('로그인 회원은 안정적인 회원 식별자로 연결하고 로그아웃 시 초기화한다', async () => {
    const { syncAnalyticsUser } = await import('./analyticsClient');

    syncAnalyticsUser('42');
    await flushAnalyticsClient();

    expect(mockPosthogClient.identify).toHaveBeenCalledWith('member:42', {
      member_id: '42',
    });

    syncAnalyticsUser('42');
    await flushAnalyticsClient();
    expect(mockPosthogClient.identify).toHaveBeenCalledTimes(1);

    syncAnalyticsUser(null);
    await flushAnalyticsClient();
    expect(mockPosthogClient.reset).toHaveBeenCalledTimes(1);
  });
});
