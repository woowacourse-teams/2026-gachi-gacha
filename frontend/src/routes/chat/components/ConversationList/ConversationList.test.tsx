import { describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/test/renderWithProviders';

import ConversationList from './ConversationList';
import { CHAT_CONVERSATIONS } from '../../storybook/chatMocks';

describe('ConversationList', () => {
  it('상태 필터 없이 선택한 채팅방 ID를 목록 페이지에 전달한다', async () => {
    const user = userEvent.setup();
    const handleSelectConversation =
      jest.fn<(conversationId: number) => void>();

    renderWithProviders(
      <ConversationList
        conversations={CHAT_CONVERSATIONS}
        selectedConversationId={undefined}
        onSelectConversation={handleSelectConversation}
      />,
      { initialAccessToken: null },
    );

    expect(screen.queryByLabelText('대화 상태')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /가챠좋아/ }));

    expect(handleSelectConversation).toHaveBeenCalledWith(1);
    expect(window.location.pathname).toBe('/');
  });
});
