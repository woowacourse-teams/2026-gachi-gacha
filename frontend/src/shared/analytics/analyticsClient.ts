let initializationPromise: Promise<void> | undefined;

export function initializeAnalytics(): void {
  if (!__POSTHOG_ENABLED__ || initializationPromise) {
    return;
  }

  initializationPromise = import('posthog-js')
    .then(({ default: posthog }) => {
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
          client.register({
            app_version: __APP_VERSION__,
            environment: __APP_ENV__,
          });
        },
      });
    })
    .catch(() => {
      // 분석 도구 장애가 사용자의 서비스 이용을 막아서는 안 됩니다.
      initializationPromise = undefined;
    });
}
