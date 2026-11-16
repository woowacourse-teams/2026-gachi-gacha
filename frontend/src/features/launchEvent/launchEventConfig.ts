export const LAUNCH_EVENT_ID = 'app-launch-2026';
export const LAUNCH_EVENT_SCHEMA_VERSION = 3;
export const LAUNCH_EVENT_RELAY_PATH = '/event-api/launch-event';

export interface LaunchEventConfig {
  enabled: boolean;
  endpoint: string;
  bannerStartAt?: string;
  startAt: string;
  endAt: string;
  campaignId: string;
}

export interface LaunchEventMetadata {
  eventId: typeof LAUNCH_EVENT_ID;
  schemaVersion: typeof LAUNCH_EVENT_SCHEMA_VERSION;
  authentication: 'server-verified';
  accepting: boolean;
  startAt: string;
  endAt: string;
  rulesVersion: string;
  privacy: {
    controller: string;
    contact: string;
    purpose: string;
    items: string[];
    retentionDays: number;
  };
}

export type LaunchEventAvailability =
  'disabled' | 'misconfigured' | 'upcoming' | 'open' | 'closed';

export const LAUNCH_EVENT_CONFIG: LaunchEventConfig = {
  enabled: __EVENT_APPLICATION_ENABLED__,
  endpoint: __EVENT_APPLICATION_ENDPOINT__,
  bannerStartAt: __EVENT_APPLICATION_BANNER_START_AT__,
  startAt: __EVENT_APPLICATION_START_AT__,
  endAt: __EVENT_APPLICATION_END_AT__,
  campaignId:
    typeof __EVENT_APPLICATION_CAMPAIGN_ID__ === 'string'
      ? __EVENT_APPLICATION_CAMPAIGN_ID__
      : '',
};

export function isLaunchEventEndpoint(endpoint: string): boolean {
  // 인증 토큰은 우리 사이트의 고정 중계 경로에만 전송한다.
  // Google 주소·다른 origin·쿼리·리다이렉트 경로는 허용하지 않는다.
  return endpoint === LAUNCH_EVENT_RELAY_PATH;
}

export function isLaunchEventDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) && Number.isFinite(Date.parse(value))
  );
}

export function getLaunchEventAvailability(
  config: LaunchEventConfig = LAUNCH_EVENT_CONFIG,
  now: Date = new Date(),
): LaunchEventAvailability {
  if (!config.enabled) return 'disabled';
  if (
    config.campaignId !== LAUNCH_EVENT_ID ||
    !isLaunchEventEndpoint(config.endpoint) ||
    !isLaunchEventDate(config.startAt) ||
    !isLaunchEventDate(config.endAt) ||
    Date.parse(config.startAt) >= Date.parse(config.endAt) ||
    !Number.isFinite(now.getTime())
  ) {
    return 'misconfigured';
  }
  if (now.getTime() < Date.parse(config.startAt)) return 'upcoming';
  if (now.getTime() >= Date.parse(config.endAt)) return 'closed';
  return 'open';
}

/** 안내 배너는 접수 시작/수신부 준비와 독립적으로 먼저 공개할 수 있다. */
export function isLaunchEventBannerVisible(
  config: LaunchEventConfig = LAUNCH_EVENT_CONFIG,
  now: Date = new Date(),
): boolean {
  const startAt = config.bannerStartAt || config.startAt;
  return (
    config.enabled &&
    config.campaignId === LAUNCH_EVENT_ID &&
    isLaunchEventDate(startAt) &&
    isLaunchEventDate(config.endAt) &&
    Date.parse(startAt) < Date.parse(config.endAt) &&
    now.getTime() >= Date.parse(startAt) &&
    now.getTime() < Date.parse(config.endAt)
  );
}

/** 클라이언트 설정만으로 접수를 열지 않고 새 수신부의 운영 설정까지 대조한다. */
export function getLaunchEventReadiness(
  config: LaunchEventConfig,
  metadata: LaunchEventMetadata | null,
  now: Date = new Date(),
): boolean {
  return (
    getLaunchEventAvailability(config, now) === 'open' &&
    metadata !== null &&
    metadata.eventId === LAUNCH_EVENT_ID &&
    metadata.schemaVersion === LAUNCH_EVENT_SCHEMA_VERSION &&
    metadata.authentication === 'server-verified' &&
    metadata.accepting &&
    Date.parse(metadata.startAt) === Date.parse(config.startAt) &&
    Date.parse(metadata.endAt) === Date.parse(config.endAt) &&
    metadata.rulesVersion.trim().length > 0 &&
    metadata.privacy.controller.trim().length > 0 &&
    metadata.privacy.contact.trim().length > 0 &&
    metadata.privacy.purpose.trim().length > 0 &&
    metadata.privacy.items.length > 0 &&
    metadata.privacy.items.every((item) => item.trim().length > 0) &&
    Number.isInteger(metadata.privacy.retentionDays) &&
    metadata.privacy.retentionDays > 0 &&
    metadata.privacy.retentionDays <= 365
  );
}
