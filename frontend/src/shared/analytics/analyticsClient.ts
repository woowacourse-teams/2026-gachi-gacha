import type {
  AnalyticsEventName,
  AnalyticsEventProperties,
} from './analyticsEventType';
import { getIsInternalUser } from './internalUser';

const ANALYTICS_MEMBER_STORAGE_KEY = 'gachi-gacha:analytics-identified-member';

let identityRevision = 0;
let identifiedMemberId: string | null = null;

function createAnalyticsContext() {
  return {
    app_version: __APP_VERSION__,
    environment: __APP_ENV__,
    is_internal_user: getIsInternalUser(),
  };
}

async function loadAnalyticsClient() {
  const analyticsContext = createAnalyticsContext();

  try {
    const { default: posthog } = await import('posthog-js');

    posthog.init(__POSTHOG_API_KEY__, {
      api_host: __POSTHOG_API_HOST__,
      autocapture: true,
      capture_pageleave: 'if_capture_pageview',
      capture_pageview: 'history_change',
      defaults: '2026-05-30',
      disable_session_recording: false,
      person_profiles: 'identified_only',
      session_recording: {
        blockSelector: '[data-private-media]',
        maskAllInputs: true,
        maskTextSelector: '[data-private]',
      },
      loaded: (client) => {
        client.register(analyticsContext);
      },
    });

    return posthog;
  } catch {
    // 분석 도구 장애가 사용자의 서비스 이용을 막아서는 안 됩니다.
    clientPromise = undefined;
    return null;
  }
}

let clientPromise: ReturnType<typeof loadAnalyticsClient> | undefined;

function getAnalyticsClient() {
  if (!__POSTHOG_ENABLED__ || getIsInternalUser()) {
    return null;
  }

  clientPromise ??= loadAnalyticsClient();

  return clientPromise;
}

export function initializeAnalytics(): void {
  const pendingClient = getAnalyticsClient();

  if (!pendingClient) {
    return;
  }

  void pendingClient;
}

export function captureAnalyticsEvent<EventName extends AnalyticsEventName>(
  eventName: EventName,
  properties: AnalyticsEventProperties<EventName>,
): void {
  const pendingClient = getAnalyticsClient();

  if (!pendingClient) {
    return;
  }

  void pendingClient.then((client) => {
    client?.capture(eventName, {
      ...properties,
      ...createAnalyticsContext(),
    });
  });
}

function readStoredAnalyticsMemberId(): string | null {
  try {
    return window.localStorage.getItem(ANALYTICS_MEMBER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeAnalyticsMemberId(memberId: string | null): void {
  try {
    if (memberId) {
      window.localStorage.setItem(ANALYTICS_MEMBER_STORAGE_KEY, memberId);
      return;
    }

    window.localStorage.removeItem(ANALYTICS_MEMBER_STORAGE_KEY);
  } catch {
    // 저장소 접근이 제한되어도 현재 실행 중인 클라이언트 식별은 계속합니다.
  }
}

/**
 * 인증 상태와 PostHog distinct id를 동기화합니다.
 * 닉네임·이름·이메일은 전송하지 않고 서버의 안정적인 회원 식별자만 사용합니다.
 */
export function syncAnalyticsUser(memberId: string | null): void {
  const revision = identityRevision + 1;

  identityRevision = revision;

  if (memberId === null) {
    const hasIdentifiedUser =
      identifiedMemberId !== null || readStoredAnalyticsMemberId() !== null;

    if (!hasIdentifiedUser) {
      return;
    }

    identifiedMemberId = null;
    storeAnalyticsMemberId(null);

    const pendingClient = getAnalyticsClient();

    if (!pendingClient) {
      return;
    }

    void pendingClient.then((client) => {
      if (!client || revision !== identityRevision) {
        return;
      }

      client.reset();
      client.register(createAnalyticsContext());
    });
    return;
  }

  if (
    identifiedMemberId === memberId &&
    readStoredAnalyticsMemberId() === memberId
  ) {
    return;
  }

  const pendingClient = getAnalyticsClient();

  if (!pendingClient) {
    return;
  }

  void pendingClient.then((client) => {
    if (!client || revision !== identityRevision) {
      return;
    }

    client.identify(`member:${memberId}`, { member_id: memberId });
    identifiedMemberId = memberId;
    storeAnalyticsMemberId(memberId);
  });
}
