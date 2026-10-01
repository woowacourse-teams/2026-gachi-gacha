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
} from '@/domains/chat/api/chatApi';
import type {
  ChatMessage as ChatMessageData,
  ChatRoomSummary,
} from '@/domains/chat/chatType';
import { useChatSocket } from '@/domains/chat/useChatSocket';
import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import { AppHeader } from '@/shared/ui/AppHeader';
import { PageLoadingFallback } from '@/shared/ui/PageLoadingFallback';

import ChatPage from './ChatPage';
import type {
  ChatConversation,
  ChatMessage,
  ChatRoom,
  ChatTradeStatus,
} from './model/chat';
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
}

const STATUS_LABELS: Record<TradeStatus, ChatTradeStatus> = {
  AVAILABLE: '교환 가능',
  IN_PROGRESS: '교환 진행 중',
  COMPLETED: '교환 완료',
};

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
                    preview: message.content,
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
  const {
    status: socketStatus,
    errorMessage: socketErrorMessage,
    sendTextMessage,
  } = useChatSocket({
    roomId: activeRoomId,
    memberId,
    onMessage: receiveMessage,
  });

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

        setState({
          status: 'success',
          rooms: activeRoomId
            ? rooms.map((room) =>
                room.roomId === activeRoomId
                  ? { ...room, unreadCount: 0 }
                  : room,
              )
            : rooms,
          selectedRoom,
          messages,
          errorMessage: '',
          hasPreviousMessages: messagePage?.hasNext === true,
          isLoadingPreviousMessages: false,
          nextLastSequence: messagePage?.nextLastSequence ?? null,
          previousMessagesError: '',
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
    () => state.rooms.map(toConversation),
    [state.rooms],
  );
  const selectedRoom = useMemo(
    () =>
      state.selectedRoom
        ? toChatRoom(state.selectedRoom, state.messages, memberId)
        : undefined,
    [memberId, state.messages, state.selectedRoom],
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
          <RetryButton type="button" onClick={() => window.location.reload()}>
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
      hasPreviousMessages={state.hasPreviousMessages}
      isLoadingPreviousMessages={state.isLoadingPreviousMessages}
      previousMessagesError={state.previousMessagesError}
      onLoadPreviousMessages={loadPreviousMessages}
      presentation={roomId ? (presentation ?? 'drawer') : 'split'}
      {...(presentation === 'modal'
        ? {
            onCloseModal: () => {
              void navigate(-1);
            },
          }
        : {})}
      onSelectConversation={(conversationId) => {
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
          navigate(`/chat/${roomId}`, {
            replace: true,
            state: location.state,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
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
  }, [location.state, navigate, tradeId]);

  if (errorMessage) {
    if (modal) {
      return (
        <ChatModalStatus
          role="alert"
          title="채팅방에 입장하지 못했어요"
          message={errorMessage}
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
          <Link to={`/trade/${tradeId}`}>게시글로 돌아가기</Link>
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
    status: STATUS_LABELS[room.trade.status],
  };
}

function toChatRoom(
  room: ChatRoomSummary,
  messages: ChatMessageData[],
  memberId: string | null,
): ChatRoom {
  return {
    conversationId: room.roomId,
    tradeId: room.trade.tradeId,
    partnerName: room.otherMember.nickname,
    partnerProfileImageUrl: room.otherMember.profileImageUrl,
    itemTitle: room.trade.title,
    itemImageUrl: room.trade.thumbnailUrl,
    tradeStatus: STATUS_LABELS[room.trade.status],
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
    text: message.content,
    sentAt: formatMessageTime(message.createdAt),
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
  role?: 'alert' | 'status';
  title?: string;
}

function ChatModalStatus({
  message,
  onClose,
  role = 'status',
  title,
}: ChatModalStatusProps) {
  return (
    <ModalStatusLayer>
      <ModalStatusScrim aria-hidden="true" />
      <ModalStatusPanel role={role}>
        {title && <h1>{title}</h1>}
        <p>{message}</p>
        {onClose && (
          <RetryButton type="button" onClick={onClose}>
            게시글로 돌아가기
          </RetryButton>
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
