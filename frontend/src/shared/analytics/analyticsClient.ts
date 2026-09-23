import type {
  AnalyticsEventName,
  AnalyticsEventProperties,
} from './analyticsEventType';
import { getIsInternalUser } from './internalUser';

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
        maskAllInputs: true,
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
