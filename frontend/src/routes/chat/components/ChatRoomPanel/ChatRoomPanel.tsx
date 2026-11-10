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
import { getTradeStatusPresentation } from '@/domains/trade/tradeStatusPresentation';
import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import { UserSafetyMenu } from '@/features/memberSafety/UserSafetyMenu';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { preventIosInputZoom } from '@/shared/styles/preventIosInputZoom';
import { breakpoint, color, focusRing, radius } from '@/shared/styles/tokens';

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
  /** `mobile`: 웹 분할 화면처럼 목록이 함께 보일 때 넓은 화면에서 뒤로 가기를 숨긴다. */
  closeVisibility?: 'always' | 'mobile';
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
  closeVisibility = 'always',
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
  const isAttachDisabled =
    !canAttachImages || selectedImages.length >= MAX_CHAT_IMAGE_COUNT;
  const isSendDisabled =
    socketStatus !== 'connected' ||
    isSending ||
    (!message.trim() && selectedImages.length === 0);
  const statusPresentation = getTradeStatusPresentation(room.tradeStatus);

  return (
    <Panel>
      <RoomHeader>
        {closeHref && (
          <CloseLink
            to={closeHref}
            aria-label="채팅 닫기"
            data-visibility={closeVisibility}
          >
            <ChevronLeftIcon />
          </CloseLink>
        )}
        {onClose && (
          <CloseButton
            type="button"
            aria-label="채팅 닫기"
            data-visibility={closeVisibility}
            onClick={onClose}
          >
            <ChevronLeftIcon />
          </CloseButton>
        )}
        <PartnerName title={room.partnerName}>{room.partnerName}</PartnerName>
        <UserSafetyMenu
          targetMemberId={room.partnerMemberId}
          targetNickname={room.partnerName}
          source="chat"
          referenceId={String(room.conversationId)}
          onBlocked={onPartnerBlocked}
          triggerVariant="toolbar"
        />
      </RoomHeader>

      <ProductSummary aria-label="교환 상품 정보">
        <TradeDetailLink
          to={`/trade/${room.tradeId}`}
          aria-label={`${room.itemTitle} 교환글 보기`}
          onClick={() =>
            captureAnalyticsEvent('chat_trade_context_selected', {
              room_id: room.conversationId,
              trade_id: room.tradeId,
              action: 'trade_detail',
            })
          }
        >
          <ProductImage>
            {room.itemImageUrl ? (
              <ProductPhoto src={room.itemImageUrl} alt="" />
            ) : (
              <ProductPlaceholder aria-hidden="true">G</ProductPlaceholder>
            )}
          </ProductImage>
          <ProductInfo>
            <ProductTitle>{room.itemTitle}</ProductTitle>
            <StatusChip
              $background={statusPresentation.background}
              $text={statusPresentation.text}
            >
              <span aria-hidden="true" />
              {statusPresentation.label}
            </StatusChip>
          </ProductInfo>
        </TradeDetailLink>
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
                  <span>{formatChatDateLabel(message.sentDate)}</span>
                </DateDivider>
              )}
              <MessageRow data-sender={message.sender}>
                <MessageContent data-sender={message.sender}>
                  {message.images.length > 0 && (
                    <ChatMessageGallery
                      roomId={room.conversationId}
                      images={message.images}
                    />
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
          <AttachLabel $disabled={isAttachDisabled}>
            <ImageIcon />
            <HiddenFileInput
              type="file"
              aria-label="사진 추가"
              accept={CHAT_IMAGE_ACCEPT}
              multiple
              disabled={isAttachDisabled}
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
            aria-label="보내기"
            aria-busy={isSending}
            disabled={isSendDisabled}
          >
            <ArrowUpIcon />
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

const lineIconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...lineIconProps}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...lineIconProps}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...lineIconProps}>
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

const desktop = `@media (min-width: ${Number.parseInt(breakpoint.tablet, 10) + 1}px)`;

const EmptyPanel = styled.section`
  display: grid;
  min-width: 0;
  min-height: 680px;
  place-content: center;
  justify-items: center;
  gap: 24px;
  background: ${color.surface};
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
  color: ${color.text};
  font-size: 20px;
  font-weight: 700;
`;

const Panel = styled.section`
  display: grid;
  height: 100%;
  min-width: 0;
  min-height: 680px;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  background: ${color.surface};

  @media (max-width: ${breakpoint.tablet}) {
    min-height: 0;
  }
`;

const RoomHeader = styled.header`
  display: flex;
  height: 48px;
  min-width: 0;
  padding: 0 14px 0 8px;
  align-items: center;
  gap: 4px;
  background: ${color.surface};

  ${desktop} {
    padding: 0 14px 0 24px;
    border-bottom: 1px solid ${color.border};
  }
`;

const closeControlStyles = css`
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: ${radius.circle};
  background: transparent;
  color: ${color.text};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: ${color.surfaceMuted};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  ${desktop} {
    &[data-visibility='mobile'] {
      display: none;
    }
  }
`;

const CloseLink = styled(Link)`
  ${closeControlStyles}
`;

const CloseButton = styled.button`
  ${closeControlStyles}
`;

const PartnerName = styled.h2`
  min-width: 0;
  overflow: hidden;
  margin: 0;
  flex: 1;
  color: ${color.text};
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductSummary = styled.section`
  display: flex;
  min-width: 0;
  padding: 10px 16px;
  align-items: center;
  gap: 12px;
  border-top: 1px solid ${color.border};
  border-bottom: 1px solid ${color.border};
  background: ${color.surface};

  ${desktop} {
    padding: 10px 24px;
    border-top: 0;
  }
`;

const TradeDetailLink = styled(Link)`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 12px;
  border-radius: ${radius.small};
  color: inherit;
  text-decoration: none;

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const ProductImage = styled.div`
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  overflow: hidden;
  place-items: center;
  border: 1px solid rgb(36 33 34 / 10%);
  border-radius: 10px;
  background: #f7f5f3;
  box-sizing: border-box;
`;

const ProductPhoto = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProductPlaceholder = styled.span`
  color: #e7a3ae;
  font-size: 18px;
  font-weight: 800;
`;

const ProductInfo = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
`;

const ProductTitle = styled.p`
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  color: ${color.text};
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusChip = styled.span<{ $background: string; $text: string }>`
  display: inline-flex;
  height: 24px;
  padding: 0 9px;
  align-items: center;
  gap: 5px;
  border-radius: ${radius.pill};
  background: ${({ $background }) => $background};
  color: ${({ $text }) => $text};
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  box-sizing: border-box;

  span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const TradeActionArea = styled.div`
  display: grid;
  max-width: 128px;
  flex: 0 0 auto;
  justify-items: end;
  gap: 6px;
`;

const TradeActionButton = styled.button`
  height: 36px;
  padding: 0 12px;
  border: 1px solid ${color.border};
  border-radius: 10px;
  background: ${color.surface};
  color: ${color.text};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: ${color.surfaceMuted};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

const TradeStatusError = styled.p`
  margin: 0;
  color: #c51645;
  font-size: 11px;
  line-height: 1.35;
  text-align: right;
`;

const Messages = styled.div`
  display: flex;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px;
  flex-direction: column;
  gap: 12px;
  background: ${color.surface};

  ${desktop} {
    padding: 20px 24px;
  }
`;

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

const PreviousMessagesButton = styled.button`
  margin: 0 auto;
  height: 32px;
  padding: 0 14px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textMuted};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

const PreviousMessagesError = styled.p`
  margin: 0 auto;
  color: #c51645;
  font-size: 12px;
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

const ComposerArea = styled.div<{ $isDragging: boolean }>`
  position: relative;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom)) 8px;
  border-top: 1px solid ${color.border};
  background: ${({ $isDragging }) =>
    $isDragging ? 'rgb(217 59 84 / 6%)' : color.surface};

  ${desktop} {
    padding: 12px 24px 12px 16px;
  }
`;

const DropGuide = styled.div`
  position: absolute;
  inset: 8px 16px;
  z-index: 2;
  display: grid;
  place-items: center;
  border: 2px dashed ${color.primary};
  border-radius: 16px;
  background: rgb(255 255 255 / 92%);
  color: #c51645;
  font-size: 13px;
  font-weight: 700;
  pointer-events: none;
`;

const SendError = styled.p`
  margin: 0 4px 8px;
  color: #c51645;
  font-size: 12px;
`;

const Composer = styled.form`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
`;

const AttachLabel = styled.label<{ $disabled: boolean }>`
  position: relative;
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: ${radius.circle};
  color: ${color.textMuted};
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};

  &:hover {
    background: ${({ $disabled }) =>
      $disabled ? 'transparent' : color.surfaceMuted};
  }

  &:focus-within {
    box-shadow: ${focusRing};
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
  height: 44px;
  flex: 1;
  padding: 0 16px;
  border: 0;
  border-radius: 22px;
  outline: 0;
  background: #f7f5f3;
  color: ${color.text};
  font-size: 14px;
  box-sizing: border-box;

  &::placeholder {
    color: ${color.textMuted};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
  }

  @media (max-width: ${breakpoint.tablet}) {
    font-size: 16px;
  }

  &:disabled {
    cursor: wait;
  }

  ${preventIosInputZoom}
`;

const SendButton = styled.button`
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: ${radius.circle};
  background: ${color.primary};
  color: #ffffff;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${color.primaryHover};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
`;
