import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { LaunchEventBanner } from './LaunchEventBanner';
import { LAUNCH_EVENT_CONFIG } from './launchEventConfig';
import { LAUNCH_EVENT_PATH } from './launchEventContent';
import { useLaunchEventClock } from './useLaunchEventClock';

jest.mock('./useLaunchEventClock', () => ({ useLaunchEventClock: jest.fn() }));

const clockMock = jest.mocked(useLaunchEventClock);
const ORIGINAL_CONFIG = { ...LAUNCH_EVENT_CONFIG };

beforeEach(() => {
  Object.assign(LAUNCH_EVENT_CONFIG, {
    enabled: true,
    endpoint: 'https://script.google.com/macros/s/test-event/exec',
    campaignId: 'app-launch-2026',
    startAt: '2026-11-11T00:00:00+09:00',
    endAt: '2026-11-25T00:00:00+09:00',
  });
  clockMock.mockReturnValue(new Date('2026-11-11T12:00:00+09:00'));
});

afterEach(() => {
  Object.assign(LAUNCH_EVENT_CONFIG, ORIGINAL_CONFIG);
});

function setup() {
  return render(
    <MemoryRouter>
      <LaunchEventBanner />
    </MemoryRouter>,
  );
}

describe('LaunchEventBanner 기간 기반 노출', () => {
  it('응모 기간에 이벤트 링크와 실제 경품 수, 남은 날짜를 표시한다', () => {
    setup();
    expect(
      screen.getByRole('link', {
        name: '가치가챠 앱 출시 기념 가챠 선물 이벤트 자세히 보기',
      }),
    ).toHaveAttribute('href', LAUNCH_EVENT_PATH);
    expect(screen.getByText('EVENT · D-13')).toBeInTheDocument();
    expect(
      screen.getByText('앱 출시 기념 · 총 8명에게 랜덤 선물'),
    ).toBeInTheDocument();
  });

  it('한국 시간 기준 마지막 응모일은 D-DAY로 표시한다', () => {
    clockMock.mockReturnValue(new Date('2026-11-24T00:00:00+09:00'));
    setup();
    expect(screen.getByText('EVENT · D-DAY')).toBeInTheDocument();
  });

  it.each([
    ['시작 전', '2026-11-10T23:59:59+09:00'],
    ['마감 시각', '2026-11-25T00:00:00+09:00'],
    ['마감 후', '2026-11-26T12:00:00+09:00'],
  ])('%s에는 배너를 숨긴다', (_label, now) => {
    clockMock.mockReturnValue(new Date(now));
    const { container } = setup();
    expect(container).toBeEmptyDOMElement();
  });

  it('기능이 꺼져 있으면 유효한 기간이어도 숨긴다', () => {
    LAUNCH_EVENT_CONFIG.enabled = false;
    const { container } = setup();
    expect(container).toBeEmptyDOMElement();
  });

  it('새 이벤트 수신부가 설정되지 않으면 예전 폼으로 연결하지 않는다', () => {
    LAUNCH_EVENT_CONFIG.campaignId = '';
    const { container } = setup();
    expect(container).toBeEmptyDOMElement();
  });

  it('열린 페이지에서도 시각 갱신 후 마감된 배너를 제거한다', () => {
    const { rerender, container } = setup();
    expect(screen.getByRole('link')).toBeInTheDocument();
    clockMock.mockReturnValue(new Date('2026-11-25T00:00:00+09:00'));
    rerender(
      <MemoryRouter>
        <LaunchEventBanner />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
