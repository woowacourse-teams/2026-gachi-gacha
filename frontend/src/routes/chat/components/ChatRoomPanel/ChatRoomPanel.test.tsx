import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatRoomPanel from './ChatRoomPanel';
import { SELECTED_CHAT_ROOM } from '../../storybook/chatMocks';

describe('ChatRoomPanel', () => {
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
});
