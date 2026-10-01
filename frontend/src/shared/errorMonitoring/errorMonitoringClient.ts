import type { RootOptions } from 'react-dom/client';
import * as Sentry from '@sentry/react';

import {
  sanitizeErrorBreadcrumb,
  sanitizeErrorEvent,
} from './sanitizeErrorEvent';

interface ErrorMonitoringConfig {
  dsn: string;
  enabled: boolean;
  environment: string;
  release: string;
}

export interface HandledErrorContext {
  feature: string;
  operation: string;
  level?: 'error' | 'warning';
}

const DEFAULT_CONFIG: ErrorMonitoringConfig = {
  dsn: __SENTRY_DSN__,
  enabled: __SENTRY_ENABLED__,
  environment: __APP_ENV__,
  release: __SENTRY_RELEASE__,
};

export function initializeErrorMonitoring(
  config: ErrorMonitoringConfig = DEFAULT_CONFIG,
): boolean {
  if (!config.enabled || !config.dsn.trim()) {
    return false;
  }

  if (Sentry.isInitialized()) {
    return true;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      sampleRate: 1,
      dataCollection: {
        cookies: false,
        databaseQueryData: false,
        frameContextLines: 3,
        genAI: { inputs: false, outputs: false },
        graphQL: { document: false, variables: false },
        httpBodies: [],
        httpHeaders: false,
        stackFrameVariables: false,
        urlQueryParams: false,
        userInfo: false,
      },
      beforeBreadcrumb: sanitizeErrorBreadcrumb,
      beforeSend: sanitizeErrorEvent,
    });

    Sentry.setTag('app.environment', config.environment);
    Sentry.setTag('app.release', config.release);

    return true;
  } catch {
    // 모니터링 도구의 초기화 실패가 서비스 이용을 막아서는 안 됩니다.
    return false;
  }
}

export function getReactRootErrorHandlers(): RootOptions | undefined {
  if (!Sentry.isInitialized()) {
    return undefined;
  }

  const captureReactError = Sentry.reactErrorHandler();

  return {
    onRecoverableError: (error, errorInfo) => {
      captureReactError(error, {
        componentStack: errorInfo.componentStack ?? null,
      });
    },
    onUncaughtError: (error, errorInfo) => {
      captureReactError(error, {
        componentStack: errorInfo.componentStack ?? null,
      });
    },
  };
}

export function setErrorMonitoringRoute(pathname: string): void {
  if (!Sentry.isInitialized()) {
    return;
  }

  Sentry.setTag('route', pathname);
}

export function setErrorMonitoringUser(memberId: string | null): void {
  if (!Sentry.isInitialized()) {
    return;
  }

  Sentry.setUser(
    memberId && /^[1-9]\d*$/.test(memberId) ? { id: memberId } : null,
  );
}

export function captureHandledError(
  error: unknown,
  { feature, operation, level = 'error' }: HandledErrorContext,
): void {
  if (!Sentry.isInitialized()) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    scope.setTag('error.handled', 'true');
    scope.setTag('feature', feature);
    scope.setTag('operation', operation);
    Sentry.captureException(error);
  });
}
