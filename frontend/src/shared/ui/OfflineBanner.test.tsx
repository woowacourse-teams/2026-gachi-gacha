import { afterEach, describe, expect, it } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';

import { OfflineBanner } from './OfflineBanner';

function setOnline(isOnline: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => isOnline,
  });
  window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
}

describe('OfflineBanner', () => {
  afterEach(() => {
    act(() => setOnline(true));
  });

  it('인터넷이 끊기면 안내 줄을 보여주고 다시 연결되면 숨긴다', () => {
    render(<OfflineBanner />);

    expect(
      screen.queryByText('인터넷 연결을 확인해 주세요.'),
    ).not.toBeInTheDocument();

    act(() => setOnline(false));
    expect(screen.getByRole('status')).toHaveTextContent(
      '인터넷 연결을 확인해 주세요.',
    );

    act(() => setOnline(true));
    expect(
      screen.queryByText('인터넷 연결을 확인해 주세요.'),
    ).not.toBeInTheDocument();
  });
});
