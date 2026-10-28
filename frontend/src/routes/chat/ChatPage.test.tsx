import { describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/renderWithProviders';

import ChatPage from './ChatPage';
import { CHAT_CONVERSATIONS, SELECTED_CHAT_ROOM } from './storybook/chatMocks';

describe('ChatPage', () => {
  it('선택한 채팅방을 독립 페이지의 오른쪽 패널로 보여준다', () => {
    renderWithProviders(
      <ChatPage
        conversations={CHAT_CONVERSATIONS}
        selectedRoom={SELECTED_CHAT_ROOM}
        socketStatus="connected"
      />,
      { initialAccessToken: null },
    );

    expect(
      screen.getByRole('complementary', {
        name: `${SELECTED_CHAT_ROOM.partnerName}님과의 채팅 페이지`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '채팅 닫기' })).toHaveAttribute(
      'href',
      `/trade/${SELECTED_CHAT_ROOM.tradeId}`,
    );
    expect(
      screen.getByRole('link', {
        name: '채팅을 닫고 교환 게시글로 돌아가기',
      }),
    ).toHaveAttribute('href', `/trade/${SELECTED_CHAT_ROOM.tradeId}`);
    expect(screen.getAllByText(SELECTED_CHAT_ROOM.itemTitle)).toHaveLength(2);
  });

  it('채팅 목록에서 선택하면 목록과 채팅방을 같은 페이지에 보여준다', async () => {
    const user = userEvent.setup();
    const handleSelectConversation =
      jest.fn<(conversationId: number | null) => void>();

    renderWithProviders(
      <ChatPage
        conversations={CHAT_CONVERSATIONS}
        selectedRoom={SELECTED_CHAT_ROOM}
        presentation="split"
        socketStatus="connected"
        onSelectConversation={handleSelectConversation}
      />,
      { initialAccessToken: null },
    );

    expect(
      screen.queryByRole('complementary', {
        name: `${SELECTED_CHAT_ROOM.partnerName}님과의 채팅 페이지`,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '전체 대화' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: SELECTED_CHAT_ROOM.partnerName }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '채팅 닫기' }));

    expect(handleSelectConversation).toHaveBeenCalledWith(null);
  });
  it('상품 세부에서 열면 배경 위에 채팅만 모달로 보여준다', async () => {
    const user = userEvent.setup();
    const handleCloseModal = jest.fn<() => void>();

    renderWithProviders(
      <ChatPage
        conversations={CHAT_CONVERSATIONS}
        selectedRoom={SELECTED_CHAT_ROOM}
        presentation="modal"
        socketStatus="connected"
        onCloseModal={handleCloseModal}
      />,
      { initialAccessToken: null },
    );

    expect(
      screen.getByRole('dialog', {
        name: `${SELECTED_CHAT_ROOM.partnerName}님과의 채팅`,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(SELECTED_CHAT_ROOM.itemTitle)).toHaveLength(1);

    await user.click(
      screen.getByRole('button', {
        name: '채팅을 닫고 교환 게시글로 돌아가기',
      }),
    );

    expect(handleCloseModal).toHaveBeenCalledTimes(1);
  });
});
