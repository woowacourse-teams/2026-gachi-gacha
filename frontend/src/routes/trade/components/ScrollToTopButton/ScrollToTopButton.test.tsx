import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import ScrollToTopButton from './ScrollToTopButton';

jest.mock('@/shared/analytics/analyticsClient', () => ({
  captureAnalyticsEvent: jest.fn(),
}));

const mockedCaptureAnalyticsEvent = jest.mocked(captureAnalyticsEvent);

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value,
  });
  fireEvent.scroll(window);
}

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({ matches }),
  });
}

afterEach(() => {
  setScrollY(0);
  jest.restoreAllMocks();
  mockedCaptureAnalyticsEvent.mockClear();
});

describe('ScrollToTopButton', () => {
  it('목록을 충분히 스크롤한 뒤에만 나타난다', () => {
    render(<ScrollToTopButton />);

    expect(
      screen.queryByRole('button', { name: '맨 위로 이동' }),
    ).not.toBeInTheDocument();

    setScrollY(479);
    expect(
      screen.queryByRole('button', { name: '맨 위로 이동' }),
    ).not.toBeInTheDocument();

    setScrollY(480);
    expect(
      screen.getByRole('button', { name: '맨 위로 이동' }),
    ).toBeInTheDocument();
  });

  it('클릭하면 부드럽게 문서 최상단으로 이동한다', async () => {
    setReducedMotion(false);
    const scrollToSpy = jest
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    const user = userEvent.setup();

    setScrollY(700);
    render(<ScrollToTopButton />);
    await user.click(screen.getByRole('button', { name: '맨 위로 이동' }));

    expect(scrollToSpy.mock.calls[0]?.[0]).toEqual({
      top: 0,
      behavior: 'smooth',
    });
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'trade_scroll_to_top_selected',
      {},
    );
  });

  it('모션 감소 환경에서는 즉시 문서 최상단으로 이동한다', async () => {
    setReducedMotion(true);
    const scrollToSpy = jest
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    const user = userEvent.setup();

    setScrollY(700);
    render(<ScrollToTopButton />);
    await user.click(screen.getByRole('button', { name: '맨 위로 이동' }));

    expect(scrollToSpy.mock.calls[0]?.[0]).toEqual({
      top: 0,
      behavior: 'auto',
    });
  });
});
