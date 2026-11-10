import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react';
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

it('상대 프로필 대신 교환 상품 사진과 안 읽은 수를 표시한다', () => {
  renderWithProviders(
    <ConversationList
      conversations={[
        {
          ...CHAT_CONVERSATIONS[0]!,
          itemImageUrl: 'https://example.com/item.jpg',
          partnerProfileImageUrl: 'https://example.com/profile.jpg',
          unreadCount: 120,
        },
      ]}
      selectedConversationId={1}
    />,
  );
  const image = screen.getByAltText('쿠로미 미니 피규어 vol.2 교환 상품 사진');
  expect(image).toHaveAttribute('src', 'https://example.com/item.jpg');
  expect(screen.getByLabelText('읽지 않은 메시지 120개')).toHaveTextContent(
    '99+',
  );
  expect(screen.getByRole('button', { name: /가챠좋아/ })).toHaveAttribute(
    'aria-current',
    'true',
  );
  expect(screen.queryByText('채팅 알림이 꺼져있어요')).not.toBeInTheDocument();
  fireEvent.error(image);
  expect(
    screen.queryByAltText('쿠로미 미니 피규어 vol.2 교환 상품 사진'),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /가챠좋아/ })).toBeInTheDocument();
});

it('목록 오류에서 재시도를 실행한다', async () => {
  const user = userEvent.setup();
  const retry = jest.fn<() => void>();
  renderWithProviders(
    <ConversationList
      conversations={[]}
      selectedConversationId={undefined}
      status="error"
      errorMessage="목록을 불러오지 못했습니다."
      onRetry={retry}
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    '목록을 불러오지 못했습니다.',
  );
  await user.click(screen.getByRole('button', { name: '다시 시도' }));
  expect(retry).toHaveBeenCalledTimes(1);
});
