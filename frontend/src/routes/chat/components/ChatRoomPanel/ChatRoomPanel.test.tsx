import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import ChatRoomPanel from './ChatRoomPanel';
import { SELECTED_CHAT_ROOM } from '../../storybook/chatMocks';

function renderPanel(panel: ReactElement) {
  return render(<MemoryRouter>{panel}</MemoryRouter>);
}

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

    renderPanel(
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

    renderPanel(
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
    renderPanel(
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

    renderPanel(
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
    renderPanel(
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

  it('작성자가 예약 확정을 누르면 교환 진행 중 상태 변경을 요청한다', async () => {
    const user = userEvent.setup();
    const handleChangeTradeStatus =
      jest.fn<
        (status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED') => Promise<void>
      >();
    handleChangeTradeStatus.mockResolvedValue();

    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        onChangeTradeStatus={handleChangeTradeStatus}
      />,
    );

    await user.click(screen.getByRole('button', { name: '예약 확정' }));

    expect(handleChangeTradeStatus).toHaveBeenCalledWith('IN_PROGRESS');
  });

  it('교환 진행 중인 글의 작성자에게 거래 완료를 제공한다', async () => {
    const user = userEvent.setup();
    const handleChangeTradeStatus =
      jest.fn<
        (status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED') => Promise<void>
      >();
    handleChangeTradeStatus.mockResolvedValue();

    renderPanel(
      <ChatRoomPanel
        room={{ ...SELECTED_CHAT_ROOM, tradeStatus: 'IN_PROGRESS' }}
        onChangeTradeStatus={handleChangeTradeStatus}
      />,
    );

    await user.click(screen.getByRole('button', { name: '거래 완료' }));

    expect(handleChangeTradeStatus).toHaveBeenCalledWith('COMPLETED');
  });

  it('구매자에게는 교환 상태 변경 버튼을 노출하지 않는다', () => {
    renderPanel(
      <ChatRoomPanel
        room={{ ...SELECTED_CHAT_ROOM, isTradeOwner: false }}
        onChangeTradeStatus={async () => undefined}
      />,
    );

    expect(
      screen.queryByRole('button', { name: '예약 확정' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '거래 완료' }),
    ).not.toBeInTheDocument();
  });

  it('거래글 이동과 공식 인스타그램 신고 동선을 제공한다', () => {
    renderPanel(<ChatRoomPanel room={SELECTED_CHAT_ROOM} />);

    expect(screen.getByRole('link', { name: '거래글로 이동' })).toHaveAttribute(
      'href',
      `/trade/${SELECTED_CHAT_ROOM.tradeId}`,
    );
    expect(
      screen.getByRole('link', {
        name: '신고하기 (인스타그램 DM, 새 창)',
      }),
    ).toHaveAttribute('href', 'https://www.instagram.com/gachi__.gacha/');
  });

  it('상태 변경에 실패하면 서버 오류를 표시한다', async () => {
    const user = userEvent.setup();

    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        onChangeTradeStatus={async () => {
          throw new Error('상태를 변경할 수 없습니다.');
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: '예약 확정' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '상태를 변경할 수 없습니다.',
    );
  });
});
