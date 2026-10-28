export type EventApplicationAvailability =
  'disabled' | 'upcoming' | 'open' | 'closed' | 'misconfigured';

export interface EventApplicationConfig {
  enabled: boolean;
  endpoint: string;
  startAt: string;
  endAt: string;
}

export const EVENT_APPLICATION_CONFIG: EventApplicationConfig = {
  enabled: __EVENT_APPLICATION_ENABLED__,
  endpoint: __EVENT_APPLICATION_ENDPOINT__,
  startAt: __EVENT_APPLICATION_START_AT__,
  endAt: __EVENT_APPLICATION_END_AT__,
};

export function getEventApplicationAvailability(
  config: EventApplicationConfig = EVENT_APPLICATION_CONFIG,
  now: Date = new Date(),
): EventApplicationAvailability {
  if (!config.enabled) {
    return 'disabled';
  }

  const startAt = new Date(config.startAt);
  const endAt = new Date(config.endAt);

  if (
    !config.endpoint.trim() ||
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    startAt >= endAt
  ) {
    return 'misconfigured';
  }

  if (now < startAt) {
    return 'upcoming';
  }

  if (now >= endAt) {
    return 'closed';
  }

  return 'open';
}

export function isEventApplicationOpen(
  config: EventApplicationConfig = EVENT_APPLICATION_CONFIG,
  now: Date = new Date(),
): boolean {
  return getEventApplicationAvailability(config, now) === 'open';
}
