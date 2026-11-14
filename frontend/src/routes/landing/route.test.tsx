import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { renderWithProviders } from '@/test/renderWithProviders';

import { LandingRoute } from './route';

jest.mock('@/shared/analytics/analyticsClient', () => ({
  captureAnalyticsEvent: jest.fn(),
  syncAnalyticsUser: jest.fn(),
}));

const mockedCaptureAnalyticsEvent = jest.mocked(captureAnalyticsEvent);

beforeEach(() => {
  window.localStorage.clear();
  mockedCaptureAnalyticsEvent.mockReset();
});

describe('LandingRoute 분석 이벤트', () => {
  it('노출된 단계와 사용자가 건너뛴 지점을 기록한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LandingRoute />, {
      initialAccessToken: null,
      route: '/',
    });

    await screen.findByRole('heading', {
      name: '여기서 교환글을 작성해 봐요!',
    });
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'landing_tour_step_viewed',
      {
        tour_version: '1',
        step_number: 1,
        target: 'create',
      },
    );

    await user.click(screen.getByRole('button', { name: /다음/ }));

    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'landing_tour_step_viewed',
      {
        tour_version: '1',
        step_number: 2,
        target: 'map',
      },
    );

    await user.click(screen.getByRole('button', { name: 'SKIP' }));

    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'landing_tour_exited',
      {
        tour_version: '1',
        exit_type: 'skip_button',
        last_step_number: 2,
      },
    );
    expect(window.location.pathname).toBe('/trade');
  });
});
