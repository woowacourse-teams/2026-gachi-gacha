import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Link, useLocation, useNavigate } from 'react-router';

import {
  createChatRoom,
  findChatRoomByTrade,
  getChatMessages,
  getChatRoom,
  getChatRooms,
  markChatMessagesRead,
  uploadChatImages,
} from '@/domains/chat/api/chatApi';
import type {
  ChatMessage as ChatMessageData,
  ChatMessageFile,
  ChatRoomSummary,
  ChatRoomUpdate,
} from '@/domains/chat/chatType';
import { compressChatImages } from '@/domains/chat/compressChatImages';
import { useChatSocket } from '@/domains/chat/useChatSocket';
import { getTradeDetail } from '@/domains/trade/api/getTradeDetail';
import { updateTradeStatus } from '@/domains/trade/api/updateTradeStatus';
import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import { AppHeader } from '@/shared/ui/AppHeader';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import ChatPage from './ChatPage';
import type { ChatConversation, ChatMessage, ChatRoom } from './model/chat';
import { toChatDateKey } from './model/chatDate';
import { useChatReadMarker } from './useChatReadMarker';

interface ChatRouteProps {
  roomId?: number;
  presentation?: 'drawer' | 'modal';
}

interface ChatRouteState {
  status: 'loading' | 'success' | 'error';
  rooms: ChatRoomSummary[];
  selectedRoom: ChatRoomSummary | null;
  messages: ChatMessageData[];
  errorMessage: string;
  hasPreviousMessages: boolean;
  isLoadingPreviousMessages: boolean;
  nextLastSequence: number | null;
  previousMessagesError: string;
  selectedTradeOwnerId: number | null;
}

export function ChatRoute({ roomId, presentation }: ChatRouteProps) {
  const { memberId } = useAuthSession();
  const navigate = useNavigate();
  const [selectedListRoomId, setSelectedListRoomId] = useState<
    number | undefined
  >();
  const activeRoomId = roomId ?? selectedListRoomId;
  const [state, setState] = useState<ChatRouteState>({
    status: 'loading',
    rooms: [],
    selectedRoom: null,
    messages: [],
    errorMessage: '',
    hasPreviousMessages: false,
    isLoadingPreviousMessages: false,
    nextLastSequence: null,
    previousMessagesError: '',
    selectedTradeOwnerId: null,
  });

  const markRead = useChatReadMarker(activeRoomId);

  const receiveMessage = useCallback(
    (message: ChatMessageData) => {
      // 열린 방에서 상대 메시지를 받으면 화면에서 읽은 것이므로 서버에도 읽음 처리합니다.
      if (
        message.roomId === activeRoomId &&
        String(message.senderId) !== memberId
      ) {
        markRead(message.sequence);
      }

      setState((current) => {
        if (
          current.messages.some(
            ({ messageId }) => messageId === message.messageId,
          )
        ) {
          return current;
        }

        return {
          ...current,
          messages: [...current.messages, message].sort(
            (first, second) => first.sequence - second.sequence,
          ),
          rooms: current.rooms.map((room) =>
            room.roomId === message.roomId
              ? {
                  ...room,
                  lastMessage: {
                    preview:
                      message.content ||
                      (message.files.length > 0 ? '사진을 보냈어요.' : ''),
                    sentAt: message.createdAt,
                  },
                  unreadCount: 0,
                }
              : room,
          ),
        };
      });
    },
    [activeRoomId, markRead, memberId],
  );
  const receiveRoomUpdate = useCallback(
    ({ room }: ChatRoomUpdate) => {
      setState((current) => {
        const nextRoom =
          room.roomId === activeRoomId ? { ...room, unreadCount: 0 } : room;

        return {
          ...current,
          rooms: [
            nextRoom,
            ...current.rooms.filter(
              (currentRoom) => currentRoom.roomId !== room.roomId,
            ),
          ],
          selectedRoom:
            current.selectedRoom?.roomId === room.roomId
              ? nextRoom
              : current.selectedRoom,
        };
      });
    },
    [activeRoomId],
  );
  const {
    status: socketStatus,
    errorMessage: socketErrorMessage,
    sendTextMessage,
    sendImageMessage: sendImageSocketMessage,
  } = useChatSocket({
    roomId: activeRoomId,
    memberId,
    onMessage: receiveMessage,
    onRoomUpdate: receiveRoomUpdate,
  });

  const sendImageMessage = useCallback(
    async (content: string, images: File[]) => {
      if (!activeRoomId || images.length === 0) {
        return;
      }

      let uploadedFiles: ChatMessageFile[];

      try {
        const compressedImages = await compressChatImages(images);
        uploadedFiles = await uploadChatImages(compressedImages);
        captureAnalyticsEvent('chat_image_upload_completed', {
          room_id: activeRoomId,
          outcome: 'success',
          image_count: images.length,
        });
      } catch (error) {
        captureAnalyticsEvent('chat_image_upload_completed', {
          room_id: activeRoomId,
          outcome: 'failure',
          image_count: images.length,
        });
        throw error;
      }

      await sendImageSocketMessage(content, uploadedFiles);
    },
    [activeRoomId, sendImageSocketMessage],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadChat(): Promise<void> {
      setState((current) =>
        current.rooms.length === 0
          ? { ...current, status: 'loading' }
          : {
              ...current,
              selectedRoom: null,
              messages: [],
              hasPreviousMessages: false,
              isLoadingPreviousMessages: false,
              nextLastSequence: null,
              previousMessagesError: '',
              selectedTradeOwnerId: null,
            },
      );

      try {
        const [rooms, selectedRoom, messagePage] = await Promise.all([
          getChatRooms(controller.signal),
          activeRoomId
            ? getChatRoom(activeRoomId, controller.signal)
            : Promise.resolve(null),
          activeRoomId
            ? getChatMessages(activeRoomId, { signal: controller.signal })
            : Promise.resolve(null),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        const messages = [...(messagePage?.messages ?? [])].sort(
          (first, second) => first.sequence - second.sequence,
        );
        const selectedTradeDetail = selectedRoom
          ? await getTradeDetail(
              selectedRoom.trade.tradeId,
              controller.signal,
            ).catch(() => null)
          : null;

        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: 'success',
          rooms: activeRoomId
            ? rooms.map((room) =>
                room.roomId === activeRoomId ||
                room.trade.tradeId === selectedTradeDetail?.tradeId
                  ? {
                      ...room,
                      unreadCount:
                        room.roomId === activeRoomId ? 0 : room.unreadCount,
                      trade: selectedTradeDetail
                        ? { ...room.trade, status: selectedTradeDetail.status }
                        : room.trade,
                    }
                  : room,
              )
            : rooms,
          selectedRoom:
            selectedRoom && selectedTradeDetail
              ? {
                  ...selectedRoom,
                  trade: {
                    ...selectedRoom.trade,
                    status: selectedTradeDetail.status,
                  },
                }
              : selectedRoom,
          messages,
          errorMessage: '',
          hasPreviousMessages: messagePage?.hasNext === true,
          isLoadingPreviousMessages: false,
          nextLastSequence: messagePage?.nextLastSequence ?? null,
          previousMessagesError: '',
          selectedTradeOwnerId: selectedTradeDetail?.memberId ?? null,
        });

        const lastMessage = messages.at(-1);

        if (activeRoomId && lastMessage) {
          void markChatMessagesRead(activeRoomId, lastMessage.sequence).catch(
            () => {
              // 읽음 처리 실패가 대화 열람을 막지 않도록 다음 진입 때 재시도합니다.
            },
          );
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState((current) => ({
          ...current,
          status: 'error',
          errorMessage:
            error instanceof Error
              ? error.message
              : '채팅 정보를 불러오지 못했습니다.',
        }));
      }
    }

    void loadChat();

    return () => {
      controller.abort();
    };
  }, [activeRoomId]);

  const conversations = useMemo(
    () =>
      state.rooms
        .filter((room) => room.lastMessage !== null)
        .map(toConversation),
    [state.rooms],
  );
  const selectedRoom = useMemo(
    () =>
      state.selectedRoom
        ? toChatRoom(
            state.selectedRoom,
            state.messages,
            memberId,
            state.selectedTradeOwnerId,
          )
        : undefined,
    [memberId, state.messages, state.selectedRoom, state.selectedTradeOwnerId],
  );

  const changeTradeStatus = useCallback(
    async (nextStatus: TradeStatus) => {
      const selectedTrade = state.selectedRoom?.trade;

      if (
        !selectedTrade ||
        state.selectedTradeOwnerId === null ||
        String(state.selectedTradeOwnerId) !== memberId
      ) {
        throw new Error('게시글 작성자만 교환 상태를 변경할 수 있습니다.');
      }

      const previousStatus = selectedTrade.status;

      try {
        const updatedTrade = await updateTradeStatus({
          tradeId: selectedTrade.tradeId,
          status: nextStatus,
        });

        captureAnalyticsEvent('trade_status_update_completed', {
          trade_id: selectedTrade.tradeId,
          previous_status: previousStatus,
          next_status: updatedTrade.status,
          outcome: 'success',
        });

        setState((current) => ({
          ...current,
          rooms: current.rooms.map((room) =>
            room.trade.tradeId === updatedTrade.tradeId
              ? {
                  ...room,
                  trade: { ...room.trade, status: updatedTrade.status },
                }
              : room,
          ),
          selectedRoom:
            current.selectedRoom?.trade.tradeId === updatedTrade.tradeId
              ? {
                  ...current.selectedRoom,
                  trade: {
                    ...current.selectedRoom.trade,
                    status: updatedTrade.status,
                  },
                }
              : current.selectedRoom,
        }));
      } catch (error) {
        captureAnalyticsEvent('trade_status_update_completed', {
          trade_id: selectedTrade.tradeId,
          previous_status: previousStatus,
          next_status: nextStatus,
          outcome: 'failure',
        });
        throw error;
      }
    },
    [memberId, state.selectedRoom, state.selectedTradeOwnerId],
  );

  const loadPreviousMessages = useCallback(async () => {
    if (
      !activeRoomId ||
      !state.hasPreviousMessages ||
      state.isLoadingPreviousMessages ||
      state.nextLastSequence === null
    ) {
      return;
    }

    const requestedRoomId = activeRoomId;
    const requestedLastSequence = state.nextLastSequence;

    setState((current) => ({
      ...current,
      isLoadingPreviousMessages: true,
      previousMessagesError: '',
    }));

    try {
      const previousPage = await getChatMessages(requestedRoomId, {
        lastSequence: requestedLastSequence,
      });

      captureAnalyticsEvent('chat_history_load_completed', {
        room_id: requestedRoomId,
        outcome: 'success',
      });

      setState((current) => {
        if (current.selectedRoom?.roomId !== requestedRoomId) {
          return current;
        }

        const messagesById = new Map(
          [...previousPage.messages, ...current.messages].map((message) => [
            message.messageId,
            message,
          ]),
        );

        return {
          ...current,
          messages: [...messagesById.values()].sort(
            (first, second) => first.sequence - second.sequence,
          ),
          hasPreviousMessages: previousPage.hasNext,
          isLoadingPreviousMessages: false,
          nextLastSequence: previousPage.nextLastSequence,
          previousMessagesError: '',
        };
      });
    } catch (error) {
      captureAnalyticsEvent('chat_history_load_completed', {
        room_id: requestedRoomId,
        outcome: 'failure',
      });
      setState((current) => ({
        ...current,
        isLoadingPreviousMessages: false,
        previousMessagesError:
          error instanceof Error
            ? error.message
            : '이전 메시지를 불러오지 못했습니다.',
      }));
    }
  }, [
    activeRoomId,
    state.hasPreviousMessages,
    state.isLoadingPreviousMessages,
    state.nextLastSequence,
  ]);

  if (state.status === 'loading') {
    if (presentation === 'modal') {
      return <ChatModalStatus message="채팅을 불러오고 있어요." />;
    }

    return <PageLoadingFallback label="채팅을 불러오고 있어요." />;
  }

  if (state.status === 'error') {
    if (presentation === 'modal') {
      return (
        <ChatModalStatus
          role="alert"
          title="채팅을 불러오지 못했어요"
          message={state.errorMessage}
          onClose={() => navigate(-1)}
        />
      );
    }

    return (
      <ErrorPage>
        <AppHeader currentPath="/chat" />
        <ErrorPanel role="alert">
          <h1>채팅을 불러오지 못했어요</h1>
          <p>{state.errorMessage}</p>
          <RetryButton
            type="button"
            onClick={() => {
              captureAnalyticsEvent('recovery_action_selected', {
                feature: 'chat',
              });
              window.location.reload();
            }}
          >
            다시 시도
          </RetryButton>
        </ErrorPanel>
      </ErrorPage>
    );
  }

  return (
    <ChatPage
      conversations={conversations}
      selectedRoom={selectedRoom}
      socketStatus={socketStatus}
      socketErrorMessage={socketErrorMessage}
      onSendMessage={sendTextMessage}
      onSendImages={sendImageMessage}
      hasPreviousMessages={state.hasPreviousMessages}
      isLoadingPreviousMessages={state.isLoadingPreviousMessages}
      previousMessagesError={state.previousMessagesError}
      onLoadPreviousMessages={loadPreviousMessages}
      onChangeTradeStatus={changeTradeStatus}
      presentation={roomId ? (presentation ?? 'drawer') : 'split'}
      {...(presentation === 'modal'
        ? {
            onCloseModal: () => {
              void navigate(-1);
            },
          }
        : {})}
      onSelectConversation={(conversationId) => {
        if (conversationId !== null) {
          captureAnalyticsEvent('chat_room_selected', {
            room_id: conversationId,
            source: 'conversation_list',
          });
        }
        setSelectedListRoomId(conversationId ?? undefined);
      }}
    />
  );
}

interface ChatStartRouteProps {
  tradeId: number;
  modal?: boolean;
}

export function ChatStartRoute({
  tradeId,
  modal = false,
}: ChatStartRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 값이 바뀌면 채팅방 조회부터 입장 흐름을 다시 실행합니다.
  const [attempt, setAttempt] = useState(0);

  function retryEnterChatRoom() {
    captureAnalyticsEvent('recovery_action_selected', { feature: 'chat' });
    setErrorMessage(null);
    setAttempt((current) => current + 1);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function enterChatRoom(): Promise<void> {
      try {
        const existingRoomId = await findChatRoomByTrade(
          tradeId,
          controller.signal,
        );
        const roomId =
          existingRoomId ?? (await createChatRoom(tradeId, controller.signal));

        if (!controller.signal.aborted) {
          captureAnalyticsEvent('chat_room_entry_completed', {
            trade_id: tradeId,
            room_id: roomId,
            room_was_created: existingRoomId === null,
            outcome: 'success',
          });
          navigate(`/chat/${roomId}`, {
            replace: true,
            state: location.state,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          captureAnalyticsEvent('chat_room_entry_completed', {
            trade_id: tradeId,
            room_id: null,
            room_was_created: false,
            outcome: 'failure',
          });
          setErrorMessage(
            error instanceof Error
              ? error.message
              : '채팅방에 입장하지 못했습니다.',
          );
        }
      }
    }

    void enterChatRoom();

    return () => {
      controller.abort();
    };
  }, [attempt, location.state, navigate, tradeId]);

  if (errorMessage) {
    if (modal) {
      return (
        <ChatModalStatus
          role="alert"
          title="채팅방에 입장하지 못했어요"
          message={errorMessage}
          onRetry={retryEnterChatRoom}
          onClose={() => navigate(-1)}
        />
      );
    }

    return (
      <ErrorPage>
        <AppHeader currentPath="/chat" />
        <ErrorPanel role="alert">
          <h1>채팅방에 입장하지 못했어요</h1>
          <p>{errorMessage}</p>
          <StatusActions>
            <RetryButton type="button" onClick={retryEnterChatRoom}>
              다시 시도
            </RetryButton>
            <Link to={`/trade/${tradeId}`}>게시글로 돌아가기</Link>
          </StatusActions>
        </ErrorPanel>
      </ErrorPage>
    );
  }

  return modal ? (
    <ChatModalStatus message="채팅방을 확인하고 있어요." />
  ) : (
    <PageLoadingFallback label="채팅방을 확인하고 있어요." />
  );
}

function toConversation(room: ChatRoomSummary): ChatConversation {
  return {
    id: room.roomId,
    partnerName: room.otherMember.nickname,
    partnerProfileImageUrl: room.otherMember.profileImageUrl,
    itemTitle: room.trade.title,
    lastMessage: room.lastMessage?.preview || '아직 메시지가 없어요.',
    lastMessageAt: room.lastMessage?.sentAt
      ? formatRelativeTime(room.lastMessage.sentAt)
      : '',
    unreadCount: room.unreadCount,
    status: room.trade.status,
  };
}

function toChatRoom(
  room: ChatRoomSummary,
  messages: ChatMessageData[],
  memberId: string | null,
  tradeOwnerId: number | null,
): ChatRoom {
  return {
    conversationId: room.roomId,
    tradeId: room.trade.tradeId,
    partnerName: room.otherMember.nickname,
    partnerProfileImageUrl: room.otherMember.profileImageUrl,
    itemTitle: room.trade.title,
    itemImageUrl: room.trade.thumbnailUrl,
    tradeStatus: room.trade.status,
    isTradeOwner: tradeOwnerId !== null && String(tradeOwnerId) === memberId,
    messages: messages.map((message) => toMessage(message, memberId)),
  };
}

function toMessage(
  message: ChatMessageData,
  memberId: string | null,
): ChatMessage {
  return {
    id: message.messageId,
    sender: String(message.senderId) === memberId ? 'me' : 'other',
    text: message.content ?? '',
    sentAt: formatMessageTime(message.createdAt),
    sentDate: toChatDateKey(message.createdAt),
    images: message.files.map((file) => ({
      url: file.url,
      name: file.originalName,
    })),
  };
}

function formatMessageTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

interface ChatModalStatusProps {
  message: string;
  onClose?: () => void | Promise<void>;
  onRetry?: () => void;
  role?: 'alert' | 'status';
  title?: string;
}

function ChatModalStatus({
  message,
  onClose,
  onRetry,
  role = 'status',
  title,
}: ChatModalStatusProps) {
  return (
    <ModalStatusLayer>
      <ModalStatusScrim aria-hidden="true" />
      <ModalStatusPanel role={role}>
        {title && <h1>{title}</h1>}
        <p>{message}</p>
        {(onRetry || onClose) && (
          <StatusActions>
            {onRetry && (
              <RetryButton type="button" onClick={onRetry}>
                다시 시도
              </RetryButton>
            )}
            {onClose &&
              (onRetry ? (
                <SecondaryButton type="button" onClick={onClose}>
                  게시글로 돌아가기
                </SecondaryButton>
              ) : (
                <RetryButton type="button" onClick={onClose}>
                  게시글로 돌아가기
                </RetryButton>
              ))}
          </StatusActions>
        )}
      </ModalStatusPanel>
    </ModalStatusLayer>
  );
}

const ErrorPage = styled.div`
  min-height: 100dvh;
  background: #ffffff;
`;

const ErrorPanel = styled.main`
  display: grid;
  min-height: 60dvh;
  padding: 32px;
  place-content: center;
  justify-items: center;
  color: #2b2528;
  text-align: center;

  h1,
  p {
    margin: 0 0 16px;
  }

  a {
    color: #ed174c;
    font-weight: 700;
  }
`;

const RetryButton = styled.button`
  padding: 12px 20px;
  border: 0;
  border-radius: 10px;
  background: #ed174c;
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
`;

const StatusActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
`;

const SecondaryButton = styled.button`
  padding: 12px 20px;
  border: 1px solid #e2dfe0;
  border-radius: 10px;
  background: #ffffff;
  color: #2b2528;
  font-weight: 700;
  cursor: pointer;
`;

const ModalStatusLayer = styled.div`
  position: fixed;
  z-index: 20;
  inset: 0;
`;

const ModalStatusScrim = styled.div`
  position: absolute;
  inset: 0;
  background: rgb(24 21 22 / 54%);
`;

const ModalStatusPanel = styled.div`
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  display: grid;
  width: min(680px, 100%);
  height: 100dvh;
  padding: 32px;
  place-content: center;
  justify-items: center;
  background: #ffffff;
  box-shadow: -12px 0 36px rgb(24 21 22 / 18%);
  color: #2b2528;
  text-align: center;

  h1,
  p {
    margin: 0 0 16px;
  }
`;
