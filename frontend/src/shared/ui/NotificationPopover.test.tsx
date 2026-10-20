import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import {
  type HeaderNotification,
  NotificationPopover,
} from './NotificationPopover';

const notifications: readonly HeaderNotification[] = [
  {
    id: 'notification-1',
    type: 'chat',
    title: '새로운 채팅이 도착했어요',
    message: '쿠로미 키링 교환이 가능한지 물어봤어요.',
    createdAtLabel: '방금 전',
    isRead: false,
    destination: '/chat/1',
  },
  {
    id: 'notification-2',
    type: 'trade',
    title: '교환이 완료되었어요',
    message: '산리오 피규어 교환 상태가 완료로 변경되었어요.',
    createdAtLabel: '1시간 전',
    isRead: true,
    destination: '/trade/12',
  },
];

function renderPopover(
  notificationState: Parameters<
    typeof NotificationPopover
  >[0]['notificationState'],
  overrides: Partial<Parameters<typeof NotificationPopover>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <NotificationPopover
        id="notification-popover"
        titleId="notification-title"
        notificationState={notificationState}
        onClose={() => undefined}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe('NotificationPopover', () => {
  it('최근 알림의 읽음 상태와 내용을 표시한다', () => {
    renderPopover({
      status: 'success',
      data: notifications,
      errorMessage: null,
    });

    expect(screen.getByRole('dialog', { name: '알림' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /새로운 채팅이 도착했어요/ }),
    ).toHaveAttribute('href', '/chat/1');
    expect(screen.getByText('교환이 완료되었어요')).toBeInTheDocument();
    expect(screen.queryByText('💬')).not.toBeInTheDocument();
    expect(screen.queryByText('모든 알림 보기')).not.toBeInTheDocument();
  });

  it('알림이 없으면 빈 상태를 표시한다', () => {
    renderPopover({ status: 'success', data: [], errorMessage: null });

    expect(screen.getByText('새로운 알림이 없어요')).toBeInTheDocument();
  });

  it('조회 실패 상태에서 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    renderPopover(
      {
        status: 'error',
        data: null,
        errorMessage: '알림을 불러오지 못했어요.',
      },
      { onRetry },
    );

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('알림을 선택하면 선택 이벤트를 알리고 팝오버를 닫는다', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onNotificationSelect = jest.fn();

    renderPopover(
      { status: 'success', data: notifications, errorMessage: null },
      { onClose, onNotificationSelect },
    );

    await user.click(
      screen.getByRole('link', { name: /새로운 채팅이 도착했어요/ }),
    );

    expect(onNotificationSelect).toHaveBeenCalledWith(notifications[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
