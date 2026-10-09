import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import type { ChatSocketStatus } from '@/domains/chat/useChatSocket';
import { TradeStatusBadge } from '@/domains/trade/components/TradeStatusBadge';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import type { ChatRoom, ChatTradeAction } from '../../model/chat';
import { formatChatDateLabel } from '../../model/chatDate';

interface ChatRoomPanelProps {
  room: ChatRoom | undefined;
  closeHref?: string | undefined;
  onClose?: (() => void) | undefined;
  socketStatus?: ChatSocketStatus;
  socketErrorMessage?: string | null;
  onSendMessage?: ((content: string) => Promise<void>) | undefined;
  hasPreviousMessages?: boolean;
  isLoadingPreviousMessages?: boolean;
  previousMessagesError?: string;
  onLoadPreviousMessages?: (() => Promise<void>) | undefined;
  onTradeAction?: ((action: ChatTradeAction) => Promise<void>) | undefined;
  isUpdatingTrade?: boolean;
  tradeActionError?: string | null;
}

export default function ChatRoomPanel({
  room,
  closeHref,
  onClose,
  socketStatus = 'disconnected',
  socketErrorMessage = null,
  onSendMessage,
  hasPreviousMessages = false,
  isLoadingPreviousMessages = false,
  previousMessagesError = '',
  onLoadPreviousMessages,
  onTradeAction,
  isUpdatingTrade = false,
  tradeActionError = null,
}: ChatRoomPanelProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);
  const lastMessageId = room?.messages.at(-1)?.id;

  useEffect(() => {
    const messagesElement = messagesRef.current;

    if (messagesElement) {
      messagesElement.scrollTop = messagesElement.scrollHeight;
    }
  }, [lastMessageId, room?.conversationId]);

  async function handleLoadPreviousMessages() {
    if (!onLoadPreviousMessages || isLoadingPreviousMessages) {
      return;
    }

    const messagesElement = messagesRef.current;
    const previousScrollHeight = messagesElement?.scrollHeight ?? 0;

    await onLoadPreviousMessages();

    requestAnimationFrame(() => {
      if (messagesElement) {
        messagesElement.scrollTop +=
          messagesElement.scrollHeight - previousScrollHeight;
      }
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const roomId = room?.conversationId;

    if (
      !roomId ||
      !onSendMessage ||
      !message.trim() ||
      socketStatus !== 'connected'
    ) {
      return;
    }

    setIsSending(true);
    setSendErrorMessage(null);

    try {
      await onSendMessage(message);
      captureAnalyticsEvent('chat_message_send_completed', {
        room_id: roomId,
        outcome: 'success',
        message_length: message.trim().length,
      });
      setMessage('');
    } catch (error) {
      captureAnalyticsEvent('chat_message_send_completed', {
        room_id: roomId,
        outcome: 'failure',
        message_length: message.trim().length,
      });
      setSendErrorMessage(
        error instanceof Error
          ? error.message
          : '메시지를 전송하지 못했습니다.',
      );
    } finally {
      setIsSending(false);
    }
  }

  if (!room) {
    return (
      <EmptyPanel>
        <EmptyIcon aria-hidden="true">
          <Bubble />
          <Bubble data-back="true" />
        </EmptyIcon>
        <EmptyTitle>대화방을 선택해주세요</EmptyTitle>
      </EmptyPanel>
    );
  }

  const tradeAction = room.tradeAction;

  return (
    <Panel>
      <RoomHeader>
        <RoomTitleGroup>
          {closeHref && (
            <CloseLink to={closeHref} aria-label="채팅 닫기">
              ←
            </CloseLink>
          )}
          {onClose && (
            <CloseButton type="button" aria-label="채팅 닫기" onClick={onClose}>
              ←
            </CloseButton>
          )}
          <div>
            <PartnerName>{room.partnerName}</PartnerName>
          </div>
        </RoomTitleGroup>
        <TradeStatusBadge status={room.tradeStatus} />
      </RoomHeader>

      <ProductContext>
        <ProductSummary>
          <ProductImage>
            {room.itemImageUrl ? (
              <ProductPhoto src={room.itemImageUrl} alt="" />
            ) : (
              '이미지 없음'
            )}
          </ProductImage>
          <ProductInfo>
            <ProductLabel>교환 상품</ProductLabel>
            <ProductTitle>{room.itemTitle}</ProductTitle>
          </ProductInfo>
          {tradeAction && onTradeAction && (
            <TradeActionButton
              type="button"
              data-action={tradeAction}
              disabled={isUpdatingTrade}
              onClick={() => void onTradeAction(tradeAction)}
            >
              {isUpdatingTrade ? '처리 중' : getTradeActionLabel(tradeAction)}
            </TradeActionButton>
          )}
        </ProductSummary>
        {tradeActionError && (
          <TradeActionError role="alert">{tradeActionError}</TradeActionError>
        )}
      </ProductContext>

      <Messages ref={messagesRef}>
        {hasPreviousMessages && (
          <PreviousMessagesButton
            type="button"
            disabled={isLoadingPreviousMessages}
            onClick={() => void handleLoadPreviousMessages()}
          >
            {isLoadingPreviousMessages
              ? '불러오는 중...'
              : '이전 메시지 불러오기'}
          </PreviousMessagesButton>
        )}
        {previousMessagesError && (
          <PreviousMessagesError role="alert">
            {previousMessagesError}
          </PreviousMessagesError>
        )}
        {room.messages.map((message, index) => {
          const previousDate = room.messages[index - 1]?.sentDate;
          const showsDateDivider =
            message.sentDate !== '' && message.sentDate !== previousDate;

          return (
            <Fragment key={message.id}>
              {showsDateDivider && (
                <DateDivider role="separator">
                  {formatChatDateLabel(message.sentDate)}
                </DateDivider>
              )}
              <MessageRow data-sender={message.sender}>
                <MessageBubble data-sender={message.sender}>
                  {message.text}
                </MessageBubble>
                <SentAt>{message.sentAt}</SentAt>
              </MessageRow>
            </Fragment>
          );
        })}
      </Messages>

      <ComposerArea>
        {(sendErrorMessage || socketErrorMessage) && (
          <SendError role="alert">
            {sendErrorMessage || socketErrorMessage}
          </SendError>
        )}
        <Composer aria-label="메시지 입력 영역" onSubmit={handleSubmit}>
          <MessageInput
            value={message}
            aria-label="메시지"
            placeholder={getMessagePlaceholder(socketStatus)}
            disabled={socketStatus !== 'connected' || isSending}
            onChange={(event) => setMessage(event.target.value)}
          />
          <SendButton
            type="submit"
            disabled={
              socketStatus !== 'connected' || isSending || !message.trim()
            }
          >
            {isSending ? '전송 중' : '보내기'}
          </SendButton>
        </Composer>
      </ComposerArea>
    </Panel>
  );
}

function getTradeActionLabel(action: ChatTradeAction): string {
  if (action === 'confirm_reservation') {
    return '예약확정';
  }

  if (action === 'cancel_reservation') {
    return '예약취소';
  }

  return '거래/교환 완료';
}

function getMessagePlaceholder(status: ChatSocketStatus): string {
  if (status === 'connected') {
    return '메시지를 입력하세요';
  }

  if (status === 'error') {
    return '채팅 서버 연결에 실패했어요';
  }

  return '채팅 서버에 연결하고 있어요';
}

const EmptyPanel = styled.section`
  display: grid;
  min-width: 0;
  min-height: 680px;
  place-content: center;
  justify-items: center;
  gap: 24px;
  background: #ffffff;
`;

const EmptyIcon = styled.div`
  position: relative;
  width: 96px;
  height: 72px;
`;

const Bubble = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: 64px;
  height: 48px;
  border-radius: 14px 14px 14px 4px;
  background: #d8d3d5;

  &[data-back='true'] {
    top: 24px;
    right: 0;
    left: auto;
    background: #ece9ea;
    transform: scaleX(-1);
  }
`;

const EmptyTitle = styled.h2`
  margin: 0;
  color: #2b2528;
  font-size: 20px;
  font-weight: 700;
`;

const Panel = styled.section`
  display: grid;
  height: 100%;
  min-width: 0;
  min-height: 680px;
  grid-template-rows: auto auto 1fr auto;
  background: #ffffff;
`;

const RoomTitleGroup = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
`;

const closeControlStyles = css`
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #2b2528;
  font-size: 22px;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: #f3f0f1;
  }
`;

const CloseLink = styled(Link)`
  ${closeControlStyles}
`;

const CloseButton = styled.button`
  ${closeControlStyles}
`;

const RoomHeader = styled.header`
  display: flex;
  min-height: 82px;
  padding: 18px 24px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #eeeaec;
`;

const PartnerName = styled.h2`
  margin: 0;
  color: #2b2528;
  font-size: 18px;
  font-weight: 700;
`;

const ProductContext = styled.div`
  border-bottom: 1px solid #eeeaec;
`;

const ProductSummary = styled.div`
  display: flex;
  padding: 14px 24px;
  align-items: center;
  gap: 12px;
`;

const ProductImage = styled.div`
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  overflow: hidden;
  place-items: center;
  border-radius: 10px;
  background: #f3f0f1;
  color: #aaa5a8;
  font-size: 9px;
  font-weight: 700;
`;

const ProductPhoto = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  border-radius: inherit;
  object-fit: cover;
`;

const ProductInfo = styled.div`
  min-width: 0;
  flex: 1;
`;

const ProductLabel = styled.p`
  margin: 0 0 4px;
  color: #9a9095;
  font-size: 11px;
`;

const ProductTitle = styled.p`
  display: -webkit-box;
  height: 2.9em;
  margin: 0;
  overflow: hidden;
  color: #2b2528;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const TradeActionButton = styled.button`
  min-height: 36px;
  padding: 8px 13px;
  flex: 0 0 auto;
  border: 1px solid #d93b54;
  border-radius: 10px;
  background: #d93b54;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;

  &[data-action='cancel_reservation'] {
    background: #ffffff;
    color: #b82f47;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.55;
  }

  @media (max-width: 420px) {
    padding: 8px 10px;
    font-size: 11px;
  }
`;

const TradeActionError = styled.p`
  padding: 0 24px 12px 88px;
  margin: 0;
  color: #d9304f;
  font-size: 12px;

  @media (max-width: 420px) {
    padding-left: 24px;
  }
`;

const Messages = styled.div`
  display: flex;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 24px;
  flex-direction: column;
  gap: 12px;
  background: #fcfbfb;
`;

const DateDivider = styled.span`
  margin: 0 auto 8px;
  color: #aaa2a6;
  font-size: 11px;
`;

const PreviousMessagesButton = styled.button`
  margin: 0 auto 4px;
  padding: 8px 14px;
  border: 1px solid #e7e1e4;
  border-radius: 999px;
  background: #ffffff;
  color: #665d61;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

const PreviousMessagesError = styled.p`
  margin: 0 auto 4px;
  color: #d9304f;
  font-size: 12px;
`;

const MessageRow = styled.div`
  display: flex;
  max-width: 76%;
  align-items: flex-end;
  gap: 7px;

  &[data-sender='me'] {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
`;

const MessageBubble = styled.p`
  margin: 0;
  padding: 11px 14px;
  border-radius: 15px 15px 15px 4px;
  background: #ffffff;
  color: #2b2528;
  font-size: 13px;
  line-height: 1.55;
  box-shadow: 0 1px 4px rgb(43 37 40 / 8%);

  &[data-sender='me'] {
    border-radius: 15px 15px 4px;
    background: #ed174c;
    color: #ffffff;
  }
`;

const SentAt = styled.span`
  flex: 0 0 auto;
  color: #aaa2a6;
  font-size: 10px;
`;

const ComposerArea = styled.div`
  padding: 12px 20px 16px;
`;

const SendError = styled.p`
  margin: 0 0 8px;
  color: #d9304f;
  font-size: 12px;
`;

const Composer = styled.form`
  display: flex;
  min-height: 48px;
  padding: 0 8px 0 18px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #eeeaec;
  border-radius: 999px;
  background: #faf8f9;
`;

const MessageInput = styled.input`
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #aaa2a6;
  font-size: 13px;

  &:disabled {
    cursor: wait;
  }
`;

const SendButton = styled.button`
  padding: 8px 12px;
  border: 0;
  border-radius: 999px;
  background: #ed174c;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
`;
