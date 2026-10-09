import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatRoomPanel from './ChatRoomPanel';
import type { ChatTradeAction } from '../../model/chat';
import { SELECTED_CHAT_ROOM } from '../../storybook/chatMocks';

describe('ChatRoomPanel', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('메시지 날짜가 바뀌는 지점마다 날짜 구분선을 표시한다', () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 1, 12, 0) });

    const messages = [
      ['2025-12-31', '작년 메시지'],
      ['2026-09-29', '그저께 메시지'],
      ['2026-09-29', '그저께 두 번째 메시지'],
      ['2026-09-30', '어제 메시지'],
      ['2026-10-01', '오늘 메시지'],
    ].map(([sentDate, text], index) => ({
      id: `message-${index}`,
      sender: 'other' as const,
      text: text ?? '',
      sentAt: '오후 2:00',
      sentDate: sentDate ?? '',
    }));

    render(
      <ChatRoomPanel
        room={{ ...SELECTED_CHAT_ROOM, messages }}
        socketStatus="connected"
      />,
    );

    expect(
      screen.getAllByRole('separator').map((divider) => divider.textContent),
    ).toEqual(['2025년 12월 31일', '9월 29일', '어제', '오늘']);
  });

  it('연결된 채팅방에서 입력한 메시지를 전송한다', async () => {
    const user = userEvent.setup();
    const handleSendMessage = jest.fn<(content: string) => Promise<void>>();
    handleSendMessage.mockResolvedValue();

    render(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        socketStatus="connected"
        onSendMessage={handleSendMessage}
      />,
    );

    await user.type(
      screen.getByRole('textbox', { name: '메시지' }),
      '안녕하세요',
    );
    await user.click(screen.getByRole('button', { name: '보내기' }));

    expect(handleSendMessage).toHaveBeenCalledWith('안녕하세요');
    expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue('');
  });

  it('서버에 연결 중이면 메시지 입력을 비활성화한다', () => {
    render(
      <ChatRoomPanel room={SELECTED_CHAT_ROOM} socketStatus="connecting" />,
    );

    expect(screen.getByRole('textbox', { name: '메시지' })).toBeDisabled();
    expect(
      screen.getByPlaceholderText('채팅 서버에 연결하고 있어요'),
    ).toBeInTheDocument();
  });

  it('이전 메시지가 있을 때 버튼으로 추가 조회한다', async () => {
    const user = userEvent.setup();
    const handleLoadPreviousMessages = jest.fn<() => Promise<void>>();
    handleLoadPreviousMessages.mockResolvedValue();

    render(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        hasPreviousMessages
        onLoadPreviousMessages={handleLoadPreviousMessages}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: '이전 메시지 불러오기' }),
    );

    expect(handleLoadPreviousMessages).toHaveBeenCalledTimes(1);
  });

  it('이전 메시지를 불러오는 동안 중복 요청을 막는다', () => {
    render(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        hasPreviousMessages
        isLoadingPreviousMessages
      />,
    );

    expect(
      screen.getByRole('button', { name: '불러오는 중...' }),
    ).toBeDisabled();
  });

  it.each([
    ['CONFIRM_RESERVATION', '예약확정'],
    ['CANCEL_RESERVATION', '예약취소'],
    ['COMPLETE_TRADE', '거래/교환 완료'],
  ] as const)(
    '%s 액션을 상품 요약 오른쪽에 표시하고 전달한다',
    async (action, label) => {
      const user = userEvent.setup();
      const handleTradeAction =
        jest.fn<(requestedAction: ChatTradeAction) => Promise<void>>();
      handleTradeAction.mockResolvedValue();

      render(
        <ChatRoomPanel
          room={{ ...SELECTED_CHAT_ROOM, tradeAction: action }}
          onTradeAction={handleTradeAction}
        />,
      );

      await user.click(screen.getByRole('button', { name: label }));

      expect(handleTradeAction).toHaveBeenCalledWith(action);
    },
  );

  it('예약 액션 요청 중에는 중복 요청을 막고 실패 메시지를 보여준다', () => {
    render(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        onTradeAction={async () => undefined}
        isUpdatingTrade
        tradeActionError="다른 채팅방에서 이미 예약됐습니다."
      />,
    );

    expect(screen.getByRole('button', { name: '처리 중' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '다른 채팅방에서 이미 예약됐습니다.',
    );
  });

  it('예약되지 않은 다른 채팅방에는 거래 액션을 표시하지 않는다', () => {
    render(
      <ChatRoomPanel
        room={{ ...SELECTED_CHAT_ROOM, tradeAction: null }}
        onTradeAction={async () => undefined}
      />,
    );

    expect(
      screen.queryByRole('button', {
        name: /예약확정|예약취소|거래\/교환 완료/,
      }),
    ).not.toBeInTheDocument();
  });
});
