export const LAUNCH_EVENT_ID = 'app-launch-2026';
export const LAUNCH_EVENT_SCHEMA_VERSION = 1;

export interface LaunchEventConfig {
  enabled: boolean;
  endpoint: string;
  startAt: string;
  endAt: string;
  campaignId: string;
}

export interface LaunchEventMetadata {
  eventId: typeof LAUNCH_EVENT_ID;
  schemaVersion: typeof LAUNCH_EVENT_SCHEMA_VERSION;
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
  startAt: __EVENT_APPLICATION_START_AT__,
  endAt: __EVENT_APPLICATION_END_AT__,
  campaignId:
    typeof __EVENT_APPLICATION_CAMPAIGN_ID__ === 'string'
      ? __EVENT_APPLICATION_CAMPAIGN_ID__
      : '',
};

export function isLaunchEventEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'script.google.com' &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)
    );
  } catch {
    return false;
  }
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
