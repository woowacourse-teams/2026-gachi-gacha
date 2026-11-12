import { Fragment, memo } from 'react';
import styled from '@emotion/styled';

import { color, radius } from '@/shared/styles/tokens';

import ChatMessageGallery from './ChatMessageGallery';
import type { ChatMessage } from '../../model/chat';
import { formatChatDateLabel } from '../../model/chatDate';

interface ChatMessageListProps {
  roomId: number;
  messages: readonly ChatMessage[];
  currentDateKey: string;
}

const ChatMessageList = memo(function ChatMessageList({
  roomId,
  messages,
  currentDateKey,
}: ChatMessageListProps) {
  const currentDate = new Date(`${currentDateKey}T00:00:00`);

  return (
    <>
      {messages.map((message, index) => {
        const previousDate = messages[index - 1]?.sentDate;
        const showsDateDivider =
          message.sentDate !== '' && message.sentDate !== previousDate;

        return (
          <Fragment key={message.id}>
            {showsDateDivider && (
              <DateDivider role="separator">
                <span>
                  {formatChatDateLabel(message.sentDate, currentDate)}
                </span>
              </DateDivider>
            )}
            <MessageRow data-sender={message.sender}>
              <MessageContent data-sender={message.sender}>
                {message.images.length > 0 && (
                  <ChatMessageGallery roomId={roomId} images={message.images} />
                )}
                {message.text && (
                  <MessageBubble data-sender={message.sender}>
                    {message.text}
                  </MessageBubble>
                )}
              </MessageContent>
              <SentAt>{message.sentAt}</SentAt>
            </MessageRow>
          </Fragment>
        );
      })}
    </>
  );
});

export default ChatMessageList;

const DateDivider = styled.div`
  display: flex;
  justify-content: center;

  span {
    display: inline-flex;
    height: 24px;
    padding: 0 10px;
    align-items: center;
    border-radius: ${radius.pill};
    background: #f3f1ef;
    color: ${color.textMuted};
    font-size: 12px;
    font-weight: 500;
  }
`;

const MessageRow = styled.div`
  display: flex;
  max-width: 76%;
  align-self: flex-start;
  align-items: flex-end;
  gap: 6px;

  &[data-sender='me'] {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
`;

const MessageContent = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;

  &[data-sender='me'] {
    align-items: flex-end;
  }
`;

const MessageBubble = styled.p`
  margin: 0;
  padding: 10px 14px;
  border-radius: 4px 16px 16px;
  background: #f3f1ef;
  color: ${color.text};
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;

  &[data-sender='me'] {
    border-radius: 16px 4px 16px 16px;
    background: ${color.primary};
    color: #ffffff;
  }
`;

const SentAt = styled.span`
  flex: 0 0 auto;
  color: ${color.textSubtle};
  font-size: 11px;
  white-space: nowrap;
`;
