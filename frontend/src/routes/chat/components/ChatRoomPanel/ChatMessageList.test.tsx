import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import ChatMessageList from './ChatMessageList';
import type { ChatMessage } from '../../model/chat';
import * as chatDate from '../../model/chatDate';

jest.mock('@/shared/analytics/analyticsClient', () => ({
  captureAnalyticsEvent: jest.fn(),
}));

const mockedCaptureAnalyticsEvent = jest.mocked(captureAnalyticsEvent);
const CURRENT_DATE_KEY = '2026-11-09';

function createMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'message-1',
    sender: 'other',
    text: '첫 메시지',
    sentAt: '오전 9:00',
    sentDate: CURRENT_DATE_KEY,
    images: [],
    ...overrides,
  };
}

function getDateLabels(): (string | null)[] {
  return screen.getAllByRole('separator').map((divider) => divider.textContent);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ChatMessageList', () => {
  it('같은 메시지와 날짜를 다시 전달하면 기존 이력의 날짜 계산을 반복하지 않는다', () => {
    const formatDateLabel = jest.spyOn(chatDate, 'formatChatDateLabel');
    const messages = [createMessage()];
    const { rerender } = render(
      <ChatMessageList
        roomId={1}
        messages={messages}
        currentDateKey={CURRENT_DATE_KEY}
      />,
    );

    expect(formatDateLabel).toHaveBeenCalled();
    formatDateLabel.mockClear();

    rerender(
      <ChatMessageList
        roomId={1}
        messages={messages}
        currentDateKey={CURRENT_DATE_KEY}
      />,
    );

    expect(formatDateLabel).not.toHaveBeenCalled();
    expect(screen.getByText('첫 메시지')).toBeInTheDocument();
    expect(getDateLabels()).toEqual(['오늘']);
  });

  it('같은 ID의 메시지가 바뀌면 본문과 발신자와 날짜와 시각과 이미지를 갱신한다', () => {
    const message = createMessage({
      images: [{ url: 'https://example.com/before.jpg', name: '수정 전 사진' }],
    });
    const { rerender } = render(
      <ChatMessageList
        roomId={1}
        messages={[message]}
        currentDateKey={CURRENT_DATE_KEY}
      />,
    );

    rerender(
      <ChatMessageList
        roomId={1}
        messages={[
          {
            ...message,
            text: '수정한 메시지',
            sender: 'me',
            sentDate: '2026-11-08',
            sentAt: '오전 9:05',
            images: [
              { url: 'https://example.com/after.jpg', name: '수정 후 사진' },
            ],
          },
        ]}
        currentDateKey={CURRENT_DATE_KEY}
      />,
    );

    expect(screen.queryByText('첫 메시지')).not.toBeInTheDocument();
    expect(screen.queryByText('오전 9:00')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: '수정 전 사진' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('수정한 메시지')).toHaveAttribute(
      'data-sender',
      'me',
    );
    expect(
      screen.getByText('수정한 메시지').parentElement?.parentElement,
    ).toHaveAttribute('data-sender', 'me');
    expect(getDateLabels()).toEqual(['어제']);
    expect(screen.getByText('오전 9:05')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '수정 후 사진' })).toHaveAttribute(
      'src',
      'https://example.com/after.jpg',
    );
  });

  it('새 메시지와 과거 메시지를 추가해도 날짜가 바뀌는 위치에만 구분선을 표시한다', () => {
    const messages = [
      createMessage({ id: 'yesterday-1', sentDate: '2026-11-08' }),
      createMessage({ id: 'yesterday-2', sentDate: '2026-11-08' }),
      createMessage({ id: 'today-1' }),
    ];
    const { rerender } = render(
      <ChatMessageList
        roomId={1}
        messages={messages}
        currentDateKey={CURRENT_DATE_KEY}
      />,
    );

    expect(getDateLabels()).toEqual(['어제', '오늘']);

    const appended = [
      ...messages,
      createMessage({ id: 'today-2', text: '새 메시지' }),
    ];
    rerender(
      <ChatMessageList
        roomId={1}
        messages={appended}
        currentDateKey={CURRENT_DATE_KEY}
      />,
    );

    expect(getDateLabels()).toEqual(['어제', '오늘']);
    expect(screen.getByText('새 메시지')).toBeInTheDocument();

    rerender(
      <ChatMessageList
        roomId={1}
        messages={[
          createMessage({
            id: 'older',
            text: '과거 메시지',
            sentDate: '2026-11-07',
          }),
          createMessage({ id: 'yesterday-0', sentDate: '2026-11-08' }),
          ...appended,
        ]}
        currentDateKey={CURRENT_DATE_KEY}
      />,
    );

    expect(getDateLabels()).toEqual(['11월 7일', '어제', '오늘']);
    expect(screen.getByText('과거 메시지')).toBeInTheDocument();
    expect(screen.getByText('새 메시지')).toBeInTheDocument();
  });

  it('메시지 참조가 같아도 현재 날짜가 바뀌면 오늘과 어제와 연도 표기를 갱신한다', () => {
    const messages = [
      createMessage({ id: 'december-30', sentDate: '2026-12-30' }),
      createMessage({ id: 'december-31', sentDate: '2026-12-31' }),
    ];
    const { rerender } = render(
      <ChatMessageList
        roomId={1}
        messages={messages}
        currentDateKey="2026-12-31"
      />,
    );

    expect(getDateLabels()).toEqual(['어제', '오늘']);

    rerender(
      <ChatMessageList
        roomId={1}
        messages={messages}
        currentDateKey="2027-01-01"
      />,
    );

    expect(getDateLabels()).toEqual(['2026년 12월 30일', '어제']);

    rerender(
      <ChatMessageList
        roomId={1}
        messages={messages}
        currentDateKey="2027-01-02"
      />,
    );

    expect(getDateLabels()).toEqual(['2026년 12월 30일', '2026년 12월 31일']);
  });

  it('메시지 참조가 같아도 방이 바뀌면 사진 확대 이벤트에 현재 방을 사용한다', () => {
    const messages = [
      createMessage({
        images: [{ url: 'https://example.com/photo.jpg', name: '교환 사진' }],
      }),
    ];
    const { rerender } = render(
      <ChatMessageList
        roomId={1}
        messages={messages}
        currentDateKey={CURRENT_DATE_KEY}
      />,
    );

    rerender(
      <ChatMessageList
        roomId={2}
        messages={messages}
        currentDateKey={CURRENT_DATE_KEY}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: '1번째 사진 크게 보기' }),
    );

    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'chat_image_viewer_opened',
      { room_id: 2, image_index: 0, image_count: 1 },
    );
    expect(
      screen.getByRole('dialog', { name: '채팅 사진 크게 보기' }),
    ).toBeInTheDocument();
  });
});
