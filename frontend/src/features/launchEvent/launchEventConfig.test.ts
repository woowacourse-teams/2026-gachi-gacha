import { describe, expect, it } from '@jest/globals';

import {
  getLaunchEventAvailability,
  getLaunchEventReadiness,
  isLaunchEventEndpoint,
  LAUNCH_EVENT_ID,
  type LaunchEventConfig,
  type LaunchEventMetadata,
} from './launchEventConfig';

const config: LaunchEventConfig = {
  enabled: true,
  endpoint: 'https://script.google.com/macros/s/test/exec',
  startAt: '2026-11-11T00:00:00+09:00',
  endAt: '2026-11-25T00:00:00+09:00',
  campaignId: LAUNCH_EVENT_ID,
};
const now = new Date('2026-11-12T00:00:00+09:00');
const metadata: LaunchEventMetadata = {
  eventId: LAUNCH_EVENT_ID,
  schemaVersion: 1,
  accepting: true,
  startAt: config.startAt,
  endAt: config.endAt,
  rulesVersion: 'test-policy-v1',
  privacy: {
    controller: '테스트 운영자',
    contact: 'test@example.com',
    purpose: '테스트 응모 접수 및 당첨 연락',
    items: ['이름', '연락처'],
    retentionDays: 30,
  },
};

describe('앱 출시 이벤트 활성화', () => {
  it('기존 이벤트 설정과 수신 주소만으로 새 이벤트를 열지 않는다', () => {
    expect(getLaunchEventAvailability({ ...config, campaignId: '' }, now)).toBe(
      'misconfigured',
    );
    expect(getLaunchEventAvailability({ ...config, enabled: false }, now)).toBe(
      'disabled',
    );
  });

  it('시작 시각 포함, 종료 시각 미포함으로 판정한다', () => {
    expect(getLaunchEventAvailability(config, new Date(config.startAt))).toBe(
      'open',
    );
    expect(getLaunchEventAvailability(config, new Date(config.endAt))).toBe(
      'closed',
    );
    expect(
      getLaunchEventAvailability(config, new Date('2026-11-10T00:00:00Z')),
    ).toBe('upcoming');
  });

  it.each([
    'https://example.com/macros/s/test/exec',
    'http://script.google.com/macros/s/test/exec',
    'https://script.google.com/macros/s/test/dev',
    'https://script.google.com/macros/s/test/exec?token=example',
    'https://user:secret@script.google.com/macros/s/test/exec',
  ])('예상하지 않은 수신 주소를 거절한다: %s', (endpoint) => {
    expect(isLaunchEventEndpoint(endpoint)).toBe(false);
  });

  it('시간대가 없거나 역전된 일정은 열지 않는다', () => {
    expect(
      getLaunchEventAvailability({ ...config, startAt: '2026-11-11' }, now),
    ).toBe('misconfigured');
    expect(
      getLaunchEventAvailability({ ...config, startAt: config.endAt }, now),
    ).toBe('misconfigured');
  });

  it('서버의 일정·동의 정책·접수 상태까지 일치해야 접수한다', () => {
    expect(getLaunchEventReadiness(config, metadata, now)).toBe(true);
    expect(getLaunchEventReadiness(config, null, now)).toBe(false);
    expect(
      getLaunchEventReadiness(config, { ...metadata, accepting: false }, now),
    ).toBe(false);
    expect(
      getLaunchEventReadiness(
        config,
        { ...metadata, endAt: config.startAt },
        now,
      ),
    ).toBe(false);
    expect(
      getLaunchEventReadiness(
        config,
        { ...metadata, privacy: { ...metadata.privacy, controller: '' } },
        now,
      ),
    ).toBe(false);
  });
});
