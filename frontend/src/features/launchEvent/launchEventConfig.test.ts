import { describe, expect, it } from '@jest/globals';

import {
  getLaunchEventAvailability,
  getLaunchEventReadiness,
  isLaunchEventBannerVisible,
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
  schemaVersion: 4,
  authentication: 'client-reported',
  capabilities: { participationPlatform: true, appOnlyParticipation: true },
  accepting: true,
  startAt: config.startAt,
  endAt: config.endAt,
  rulesVersion: 'test-policy-v1',
  privacy: {
    controller: '테스트 운영자',
    contact: 'test@example.com',
    purpose: '테스트 응모 접수 및 당첨 연락',
    items: ['이름', '인스타그램 아이디', '회원 번호', '거래글 번호'],
    retentionDays: 30,
  },
};

describe('앱 출시 이벤트 활성화', () => {
  it('수신부 연결 전에도 안내 기간에는 배너만 표시할 수 있다', () => {
    const noticeConfig = {
      ...config,
      endpoint: '',
      bannerStartAt: '2026-11-10T00:00:00+09:00',
      startAt: '2026-11-20T00:00:00+09:00',
      endAt: '2026-11-28T00:00:00+09:00',
    };
    expect(isLaunchEventBannerVisible(noticeConfig, now)).toBe(true);
    expect(getLaunchEventReadiness(noticeConfig, null, now)).toBe(false);
    expect(
      isLaunchEventBannerVisible(noticeConfig, new Date(noticeConfig.endAt)),
    ).toBe(false);
  });

  it('배너 공개 시각이 잘못되었거나 종료 이후라면 배너를 숨긴다', () => {
    expect(
      isLaunchEventBannerVisible({ ...config, bannerStartAt: 'bad' }, now),
    ).toBe(false);
    expect(
      isLaunchEventBannerVisible(
        { ...config, bannerStartAt: config.endAt },
        now,
      ),
    ).toBe(false);
    expect(isLaunchEventBannerVisible(config, new Date('bad'))).toBe(false);
  });
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

  it('공개 Apps Script 실행 주소만 허용한다', () => {
    expect(isLaunchEventEndpoint(config.endpoint)).toBe(true);
  });

  it.each([
    '/event-api/launch-event',
    '//example.com/event-api/launch-event',
    '/event-api/launch-event?redirect=other',
    '/event-api/launch-event/',
    'https://example.com/macros/s/test/exec',
    'http://script.google.com/macros/s/test/exec',
    'https://script.google.com/macros/s/test/dev',
    'https://script.google.com/macros/s/test/exec?token=example',
    'https://user:secret@script.google.com/macros/s/test/exec',
    'https://script.google.com.evil.example/macros/s/test/exec',
    'https://script.google.com/macros/s/test/exec#token',
    'https://script.google.com:443/macros/s/test/exec',
    'https://script.google.com/macros/s/test/../other/exec',
    'https://script.google.com/macros/s/test/exec\n',
    'https://script.google.com/macros/s/test/exec\r\n',
    ' https://script.google.com/macros/s/test/exec',
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

  it.each([undefined, { participationPlatform: true as const }])(
    '앱 전용 접수 capability가 없는 수신부는 준비 완료로 보지 않는다: %j',
    (capabilities) => {
      const legacyMetadata = { ...metadata };
      if (capabilities) legacyMetadata.capabilities = capabilities;
      else delete legacyMetadata.capabilities;
      expect(getLaunchEventReadiness(config, legacyMetadata, now)).toBe(false);
    },
  );

  it('서버의 앱 전용 계약·일정·동의 정책·접수 상태까지 일치해야 접수한다', () => {
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
