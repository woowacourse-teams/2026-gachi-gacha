import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { renderWithProviders } from '@/test/renderWithProviders';

import { UpdatesRoute } from './route';

jest.mock('@/shared/analytics/analyticsClient', () => ({
  captureAnalyticsEvent: jest.fn(),
  syncAnalyticsUser: jest.fn(),
}));

const mockedCaptureAnalyticsEvent = jest.mocked(captureAnalyticsEvent);

beforeEach(() => {
  mockedCaptureAnalyticsEvent.mockReset();
});

describe('UpdatesRoute', () => {
  it('운영에 공개된 서비스 버전을 최신순으로 안내한다', () => {
    renderWithProviders(<UpdatesRoute />, { route: '/updates' });

    expect(
      screen.getByRole('heading', { name: '조금씩 더 좋아지고 있어요' }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByText('최신 공개 버전')
        .filter((badge) => badge.getAttribute('aria-hidden') !== 'true'),
    ).toHaveLength(1);

    const versionLabels = screen
      .getAllByText(/^v1\.[0-8]\.0$/)
      .map((element) => element.textContent);

    expect(versionLabels).toEqual([
      'v1.8.0',
      'v1.7.0',
      'v1.6.0',
      'v1.5.0',
      'v1.4.0',
      'v1.3.0',
      'v1.2.0',
      'v1.1.0',
      'v1.0.0',
    ]);
    expect(
      screen.getAllByRole('link', { name: '전체 변경 기록 보기' }),
    ).toHaveLength(9);
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'updates_page_viewed',
      {
        latest_visible_version: 'v1.8.0',
        release_count: 9,
      },
    );

    const latestReleaseLink = screen.getAllByRole('link', {
      name: '전체 변경 기록 보기',
    })[0];

    expect(latestReleaseLink).toBeDefined();
    fireEvent.click(latestReleaseLink!);

    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'release_notes_selected',
      {
        version: 'v1.8.0',
        is_latest: true,
      },
    );
  });

  it('뒤로 가기는 이전 화면이 없으면 홈으로 이동한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<UpdatesRoute />, { route: '/updates' });

    await user.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(window.location.pathname).toBe('/trade');
  });
});
