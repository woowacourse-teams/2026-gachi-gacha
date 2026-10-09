import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';

import type {
  ChatMessage,
  ChatMessagePage,
  ChatRoomSummary,
  ChatTradeAction,
} from '../chatType';

const CHAT_ROOMS_PATH = '/api/v1/chat/rooms';
const JSON_CONTENT_TYPE = 'application/json';

interface BaseResponse<T> {
  data: T;
}

interface ChatRoomExistence {
  isExist: boolean;
  roomId: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.message === 'string'
    ? value.message
    : fallback;
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)) {
    throw new Error(fallback);
  }

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(body, fallback));
  }

  if (!isRecord(body) || !('data' in body)) {
    throw new Error(fallback);
  }

  return (body as unknown as BaseResponse<T>).data;
}

export async function getChatRooms(
  signal?: AbortSignal,
): Promise<ChatRoomSummary[]> {
  const response = await authenticatedFetch(
    `${CHAT_ROOMS_PATH}/me`,
    signal ? { signal } : {},
  );
  const data = await readJson<{ rooms?: ChatRoomSummary[] }>(
    response,
    '채팅방 목록을 불러오지 못했습니다.',
  );

  return Array.isArray(data.rooms)
    ? data.rooms.map(normalizeChatRoomSummary)
    : [];
}

export async function getChatRoom(
  roomId: number,
  signal?: AbortSignal,
): Promise<ChatRoomSummary> {
  validatePositiveId(roomId, '채팅방');
  const response = await authenticatedFetch(
    `${CHAT_ROOMS_PATH}/${roomId}`,
    signal ? { signal } : {},
  );
  const data = await readJson<ChatRoomSummary>(
    response,
    '채팅방을 불러오지 못했습니다.',
  );

  return normalizeChatRoomSummary(data);
}

export async function getChatMessages(
  roomId: number,
  options: GetChatMessagesOptions = {},
): Promise<ChatMessagePage> {
  validatePositiveId(roomId, '채팅방');
  const searchParams = new URLSearchParams();

  if (options.lastSequence !== undefined) {
    searchParams.set('lastSequence', String(options.lastSequence));
  }

  if (options.pageSize !== undefined) {
    searchParams.set('pageSize', String(options.pageSize));
  }

  const query = searchParams.toString();
  const response = await authenticatedFetch(
    `${CHAT_ROOMS_PATH}/${roomId}/messages${query ? `?${query}` : ''}`,
    options.signal ? { signal: options.signal } : {},
  );
  const data = await readJson<ChatMessagePage>(
    response,
    '메시지를 불러오지 못했습니다.',
  );

  return {
    messages: Array.isArray(data.messages)
      ? data.messages.map(normalizeMessage)
      : [],
    nextLastSequence:
      typeof data.nextLastSequence === 'number' ? data.nextLastSequence : null,
    hasNext: data.hasNext === true,
  };
}

interface GetChatMessagesOptions {
  lastSequence?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export async function findChatRoomByTrade(
  tradeId: number,
  signal?: AbortSignal,
): Promise<number | null> {
  validatePositiveId(tradeId, '교환 게시글');
  const searchParams = new URLSearchParams({ tradeId: String(tradeId) });
  const response = await authenticatedFetch(
    `${CHAT_ROOMS_PATH}/existence?${searchParams.toString()}`,
    signal ? { signal } : {},
  );
  const data = await readJson<ChatRoomExistence>(
    response,
    '기존 채팅방을 확인하지 못했습니다.',
  );

  return data.isExist && typeof data.roomId === 'number' ? data.roomId : null;
}

export async function createChatRoom(
  tradeId: number,
  signal?: AbortSignal,
): Promise<number> {
  validatePositiveId(tradeId, '교환 게시글');
  const response = await authenticatedFetch(CHAT_ROOMS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': JSON_CONTENT_TYPE },
    body: JSON.stringify({ tradeId }),
    ...(signal ? { signal } : {}),
  });
  const data = await readJson<{ roomId?: number }>(
    response,
    '채팅방을 만들지 못했습니다.',
  );

  if (typeof data.roomId !== 'number') {
    throw new Error('생성된 채팅방 정보를 확인하지 못했습니다.');
  }

  return data.roomId;
}

export async function updateChatTrade(
  roomId: number,
  action: ChatTradeAction,
): Promise<ChatRoomSummary> {
  validatePositiveId(roomId, '채팅방');
  const response = await authenticatedFetch(
    `${CHAT_ROOMS_PATH}/${roomId}/trade`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': JSON_CONTENT_TYPE },
      body: JSON.stringify({ action }),
    },
  );
  const data = await readJson<ChatRoomSummary>(
    response,
    '교환 상태를 변경하지 못했습니다.',
  );

  return normalizeChatRoomSummary(data);
}

export async function markChatMessagesRead(
  roomId: number,
  lastReadSequence: number,
): Promise<void> {
  validatePositiveId(roomId, '채팅방');
  const response = await authenticatedFetch(
    `${CHAT_ROOMS_PATH}/${roomId}/messages/read`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': JSON_CONTENT_TYPE },
      body: JSON.stringify({ lastReadSequence }),
    },
  );

  if (!response.ok) {
    const body: unknown = response.headers
      .get('content-type')
      ?.includes(JSON_CONTENT_TYPE)
      ? await response.json()
      : null;

    throw new Error(
      getErrorMessage(body, '메시지를 읽음 처리하지 못했습니다.'),
    );
  }
}

function validatePositiveId(id: number, subject: string): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`올바른 ${subject} ID가 필요합니다.`);
  }
}

export function normalizeChatRoomSummary(
  room: ChatRoomSummary,
): ChatRoomSummary {
  return {
    ...room,
    trade: {
      ...room.trade,
      availableAction: isChatTradeAction(room.trade.availableAction)
        ? room.trade.availableAction
        : null,
    },
    lastMessage: room.lastMessage
      ? {
          ...room.lastMessage,
          sentAt:
            room.lastMessage.sentAt ??
            (room.lastMessage as ChatLastMessageWire).sendAt ??
            '',
        }
      : null,
  };
}

function isChatTradeAction(value: unknown): value is ChatTradeAction {
  return (
    value === 'CONFIRM_RESERVATION' ||
    value === 'CANCEL_RESERVATION' ||
    value === 'COMPLETE_TRADE'
  );
}

interface ChatLastMessageWire {
  sendAt?: string;
}

function normalizeMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    messageId: String(message.messageId),
  };
}
