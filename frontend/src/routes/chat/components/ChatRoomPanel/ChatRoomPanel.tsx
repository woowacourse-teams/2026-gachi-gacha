import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import {
  CHAT_IMAGE_ACCEPT,
  MAX_CHAT_IMAGE_COUNT,
  MAX_CHAT_IMAGE_SIZE_MB,
  validateChatImage,
} from '@/domains/chat/chatImagePolicy';
import type { ChatSocketStatus } from '@/domains/chat/useChatSocket';
import { TradeStatusBadge } from '@/domains/trade/components/TradeStatusBadge';
import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import { UserSafetyMenu } from '@/features/memberSafety/UserSafetyMenu';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import ChatImagePreview from './ChatImagePreview';
import ChatMessageGallery from './ChatMessageGallery';
import type { ChatRoom } from '../../model/chat';
import { formatChatDateLabel } from '../../model/chatDate';
import { getChatTradeStatusAction } from '../../model/chatTradeStatusAction';

interface ChatRoomPanelProps {
  room: ChatRoom | undefined;
  closeHref?: string | undefined;
  onClose?: (() => void) | undefined;
  socketStatus?: ChatSocketStatus;
  socketErrorMessage?: string | null;
  onSendMessage?: ((content: string) => Promise<void>) | undefined;
  onSendImages?:
    ((content: string, images: File[]) => Promise<void>) | undefined;
  hasPreviousMessages?: boolean;
  isLoadingPreviousMessages?: boolean;
  previousMessagesError?: string;
  onLoadPreviousMessages?: (() => Promise<void>) | undefined;
  onChangeTradeStatus?: ((status: TradeStatus) => Promise<void>) | undefined;
  onPartnerBlocked?: (() => void) | undefined;
}

export default function ChatRoomPanel({
  room,
  closeHref,
  onClose,
  socketStatus = 'disconnected',
  socketErrorMessage = null,
  onSendMessage,
  onSendImages,
  hasPreviousMessages = false,
  isLoadingPreviousMessages = false,
  previousMessagesError = '',
  onLoadPreviousMessages,
  onChangeTradeStatus,
  onPartnerBlocked,
}: ChatRoomPanelProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);
  const [isUpdatingTradeStatus, setIsUpdatingTradeStatus] = useState(false);
  const [tradeStatusError, setTradeStatusError] = useState<string | null>(null);
  const lastMessageId = room?.messages.at(-1)?.id;
  const tradeStatusAction = room
    ? getChatTradeStatusAction(room.tradeStatus, room.isTradeOwner)
    : null;

  useEffect(() => {
    const messagesElement = messagesRef.current;

    if (messagesElement) {
      messagesElement.scrollTop = messagesElement.scrollHeight;
    }
  }, [lastMessageId, room?.conversationId]);

  useEffect(() => {
    setTradeStatusError(null);
    setIsUpdatingTradeStatus(false);
  }, [room?.conversationId, room?.tradeStatus]);

  useEffect(() => {
    setMessage('');
    setSelectedImages([]);
    setSendErrorMessage(null);
    setIsDraggingImages(false);
  }, [room?.conversationId]);

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

    const normalizedMessage = message.trim();
    const imagesToSend = [...selectedImages];
    const sendsImages = imagesToSend.length > 0;

    if (!roomId || socketStatus !== 'connected' || isSending) {
      return;
    }

    if (sendsImages ? !onSendImages : !onSendMessage || !normalizedMessage) {
      return;
    }

    setIsSending(true);
    setSendErrorMessage(null);

    try {
      if (sendsImages && onSendImages) {
        await onSendImages(normalizedMessage, imagesToSend);
      } else if (onSendMessage) {
        await onSendMessage(normalizedMessage);
      }
      captureAnalyticsEvent('chat_message_send_completed', {
        room_id: roomId,
        outcome: 'success',
        message_length: normalizedMessage.length,
        message_type: sendsImages ? 'image' : 'text',
        image_count: imagesToSend.length,
      });
      setMessage('');
      setSelectedImages([]);
    } catch (error) {
      captureAnalyticsEvent('chat_message_send_completed', {
        room_id: roomId,
        outcome: 'failure',
        message_length: normalizedMessage.length,
        message_type: sendsImages ? 'image' : 'text',
        image_count: imagesToSend.length,
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

  function addImages(files: readonly File[]) {
    const roomId = room?.conversationId;

    if (!roomId || files.length === 0) {
      return;
    }

    const remainingCount = MAX_CHAT_IMAGE_COUNT - selectedImages.length;
    const candidates = files.slice(0, Math.max(0, remainingCount));
    const accepted: File[] = [];
    let rejectedCount = Math.max(0, files.length - candidates.length);
    let hasUnsupportedType = false;
    let hasOversizedImage = false;

    candidates.forEach((file) => {
      const rejection = validateChatImage(file);

      if (rejection === null) {
        accepted.push(file);
      } else {
        rejectedCount += 1;
        hasUnsupportedType ||= rejection === 'unsupported-type';
        hasOversizedImage ||= rejection === 'too-large';
      }
    });

    setSelectedImages((current) => [...current, ...accepted]);
    captureAnalyticsEvent('chat_image_selection_completed', {
      room_id: roomId,
      accepted_count: accepted.length,
      rejected_count: rejectedCount,
    });

    if (files.length > remainingCount) {
      setSendErrorMessage(
        `사진은 한 번에 최대 ${MAX_CHAT_IMAGE_COUNT}장까지 보낼 수 있어요.`,
      );
    } else if (hasOversizedImage) {
      setSendErrorMessage(
        `사진은 한 장당 ${MAX_CHAT_IMAGE_SIZE_MB}MB 이하만 선택할 수 있어요.`,
      );
    } else if (hasUnsupportedType) {
      setSendErrorMessage('JPG, PNG, WebP 사진만 선택할 수 있어요.');
    } else {
      setSendErrorMessage(null);
    }
  }

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    addImages(Array.from(event.target.files ?? []));
    event.target.value = '';
  }

  function handleImageDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!canAttachImages) {
      return;
    }

    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingImages(true);
  }

  function handleImageDragLeave(event: DragEvent<HTMLDivElement>) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setIsDraggingImages(false);
  }

  function handleImageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingImages(false);

    if (canAttachImages) {
      addImages(Array.from(event.dataTransfer.files));
    }
  }

  async function handleTradeStatusChange() {
    if (!tradeStatusAction || !onChangeTradeStatus || isUpdatingTradeStatus) {
      return;
    }

    setIsUpdatingTradeStatus(true);
    setTradeStatusError(null);

    try {
      await onChangeTradeStatus(tradeStatusAction.nextStatus);
    } catch (error) {
      setTradeStatusError(
        error instanceof Error
          ? error.message
          : '교환 상태를 변경하지 못했습니다.',
      );
    } finally {
      setIsUpdatingTradeStatus(false);
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

  const canAttachImages =
    Boolean(onSendImages) && socketStatus === 'connected' && !isSending;

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
        <HeaderActions>
          <TradeStatusBadge status={room.tradeStatus} />
          <UserSafetyMenu
            targetMemberId={room.partnerMemberId}
            targetNickname={room.partnerName}
            source="chat"
            referenceId={String(room.conversationId)}
            onBlocked={onPartnerBlocked}
          />
        </HeaderActions>
      </RoomHeader>

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
          <ProductLinks>
            <TradeDetailLink
              to={`/trade/${room.tradeId}`}
              onClick={() =>
                captureAnalyticsEvent('chat_trade_context_selected', {
                  room_id: room.conversationId,
                  trade_id: room.tradeId,
                  action: 'trade_detail',
                })
              }
            >
              거래글로 이동
            </TradeDetailLink>
          </ProductLinks>
        </ProductInfo>
        {tradeStatusAction && onChangeTradeStatus && (
          <TradeActionArea>
            <TradeActionButton
              type="button"
              disabled={isUpdatingTradeStatus}
              aria-busy={isUpdatingTradeStatus}
              onClick={() => void handleTradeStatusChange()}
            >
              {isUpdatingTradeStatus ? '변경 중...' : tradeStatusAction.label}
            </TradeActionButton>
            {tradeStatusError && (
              <TradeStatusError role="alert">
                {tradeStatusError}
              </TradeStatusError>
            )}
          </TradeActionArea>
        )}
      </ProductSummary>

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
                  {message.images.length > 0 && (
                    <ChatMessageGallery
                      roomId={room.conversationId}
                      images={message.images}
                    />
                  )}
                  {message.text && <MessageText>{message.text}</MessageText>}
                </MessageBubble>
                <SentAt>{message.sentAt}</SentAt>
              </MessageRow>
            </Fragment>
          );
        })}
      </Messages>

      <ComposerArea
        $isDragging={isDraggingImages}
        onDragOver={handleImageDragOver}
        onDragLeave={handleImageDragLeave}
        onDrop={handleImageDrop}
      >
        {selectedImages.length > 0 && (
          <ChatImagePreview
            files={selectedImages}
            onRemove={(index) =>
              setSelectedImages((current) =>
                current.filter((_, currentIndex) => currentIndex !== index),
              )
            }
          />
        )}
        {(sendErrorMessage || socketErrorMessage) && (
          <SendError role="alert">
            {sendErrorMessage || socketErrorMessage}
          </SendError>
        )}
        {isDraggingImages && <DropGuide>사진을 여기에 놓아주세요</DropGuide>}
        <Composer aria-label="메시지 입력 영역" onSubmit={handleSubmit}>
          <AttachLabel
            $disabled={
              !canAttachImages || selectedImages.length >= MAX_CHAT_IMAGE_COUNT
            }
          >
            <span aria-hidden="true">+</span>
            <HiddenFileInput
              type="file"
              aria-label="사진 추가"
              accept={CHAT_IMAGE_ACCEPT}
              multiple
              disabled={
                !canAttachImages ||
                selectedImages.length >= MAX_CHAT_IMAGE_COUNT
              }
              onChange={handleImageSelection}
            />
          </AttachLabel>
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
              socketStatus !== 'connected' ||
              isSending ||
              (!message.trim() && selectedImages.length === 0)
            }
          >
            {isSending ? '전송 중' : '보내기'}
          </SendButton>
        </Composer>
      </ComposerArea>
    </Panel>
  );
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

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PartnerName = styled.h2`
  margin: 0;
  color: #2b2528;
  font-size: 18px;
  font-weight: 700;
`;

const ProductSummary = styled.div`
  display: grid;
  padding: 14px 24px;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #eeeaec;

  @media (max-width: 440px) {
    grid-template-columns: 52px minmax(0, 1fr);
    align-items: start;
  }
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
  margin: 0;
  overflow: hidden;
  color: #2b2528;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const ProductLinks = styled.div`
  display: flex;
  margin-top: 5px;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 11px;
`;

const TradeDetailLink = styled(Link)`
  color: #9a9095;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const TradeActionArea = styled.div`
  display: grid;
  max-width: 116px;
  justify-items: end;
  gap: 6px;

  @media (max-width: 440px) {
    grid-column: 2;
    max-width: none;
    justify-items: start;
  }
`;

const TradeActionButton = styled.button`
  min-height: 36px;
  padding: 8px 14px;
  border: 0;
  border-radius: 10px;
  background: #ed174c;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

const TradeStatusError = styled.p`
  margin: 0;
  color: #d9304f;
  font-size: 10px;
  line-height: 1.35;
  text-align: right;

  @media (max-width: 440px) {
    text-align: left;
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

const MessageBubble = styled.div`
  margin: 0;
  overflow: hidden;
  padding: 4px;
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

const MessageText = styled.p`
  margin: 0;
  padding: 7px 10px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const SentAt = styled.span`
  flex: 0 0 auto;
  color: #aaa2a6;
  font-size: 10px;
`;

const ComposerArea = styled.div<{ $isDragging: boolean }>`
  position: relative;
  padding: 12px 20px 16px;
  background: ${({ $isDragging }) =>
    $isDragging ? 'rgb(237 23 76 / 6%)' : '#ffffff'};
`;

const DropGuide = styled.div`
  position: absolute;
  inset: 8px 16px;
  z-index: 2;
  display: grid;
  place-items: center;
  border: 2px dashed #ed174c;
  border-radius: 16px;
  background: rgb(255 255 255 / 92%);
  color: #c71943;
  font-size: 13px;
  font-weight: 700;
  pointer-events: none;
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

const AttachLabel = styled.label<{ $disabled: boolean }>`
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #ded7da;
  border-radius: 50%;
  background: #ffffff;
  color: #665d61;
  font-size: 24px;
  line-height: 1;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};

  span {
    transform: translateY(-1px);
  }
`;

const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
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
