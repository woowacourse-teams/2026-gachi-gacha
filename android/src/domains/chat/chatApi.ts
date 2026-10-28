import { authenticatedFetch } from '../auth/authApi';
import { TRADE_STATUSES } from '../trade/tradeTypes';
import type {
  ChatImageUpload,
  ChatMessage,
  ChatMessageFile,
  ChatMessagePage,
  ChatRoomSummary,
} from './chatTypes';

const ROOMS_PATH = '/api/v1/chat/rooms';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`올바른 ${label}가 필요합니다.`);
  }
}

async function readData(response: Response, fallback: string): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(fallback);
  }
  const body: unknown = await response.json();
  if (!response.ok || !isRecord(body)) {
    throw new Error(isRecord(body) && typeof body.message === 'string' ? body.message : fallback);
  }
  return body.data;
}

function parseFile(value: unknown): ChatMessageFile {
  if (
    !isRecord(value) ||
    typeof value.url !== 'string' ||
    typeof value.originalName !== 'string' ||
    !(value.contentType === null || typeof value.contentType === 'string') ||
    !isNonNegativeInteger(value.size)
  ) throw new Error('채팅 파일 응답 형식이 올바르지 않습니다.');
  return {
    contentType: value.contentType,
    originalName: value.originalName,
    size: value.size,
    url: value.url,
  };
}

export function parseChatMessage(value: unknown): ChatMessage {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.sequence) ||
    !isPositiveInteger(value.roomId) ||
    !isPositiveInteger(value.senderId) ||
    !['TEXT', 'IMAGE', 'FILE', 'ENTER', 'LEAVE'].includes(String(value.type)) ||
    !(value.content === null || typeof value.content === 'string') ||
    !Array.isArray(value.files) ||
    typeof value.createdAt !== 'string' ||
    !(typeof value.messageId === 'string' || typeof value.messageId === 'number')
  ) throw new Error('채팅 메시지 응답 형식이 올바르지 않습니다.');
  return {
    content: value.content,
    createdAt: value.createdAt,
    files: value.files.map(parseFile),
    messageId: String(value.messageId),
    roomId: value.roomId,
    senderId: value.senderId,
    sequence: value.sequence,
    type: value.type as ChatMessage['type'],
  };
}

export function parseChatRoom(value: unknown): ChatRoomSummary {
  if (!isRecord(value) || !isRecord(value.trade) || !isRecord(value.otherMember)) {
    throw new Error('채팅방 응답 형식이 올바르지 않습니다.');
  }
  const { trade, otherMember } = value;
  const status = String(trade.status);
  if (
    !isPositiveInteger(value.roomId) ||
    !isPositiveInteger(trade.tradeId) ||
    typeof trade.title !== 'string' ||
    !TRADE_STATUSES.some((candidate) => candidate === status) ||
    !(trade.thumbnailUrl === null || typeof trade.thumbnailUrl === 'string') ||
    !isPositiveInteger(otherMember.memberId) ||
    typeof otherMember.nickname !== 'string' ||
    !(otherMember.profileImageUrl === null || typeof otherMember.profileImageUrl === 'string') ||
    !isNonNegativeInteger(value.unreadCount) ||
    typeof value.createdAt !== 'string'
  ) throw new Error('채팅방 응답 형식이 올바르지 않습니다.');

  let lastMessage = null;
  if (value.lastMessage !== null) {
    if (!isRecord(value.lastMessage) || typeof value.lastMessage.preview !== 'string') {
      throw new Error('채팅방 응답 형식이 올바르지 않습니다.');
    }
    const sentAt = value.lastMessage.sentAt ?? value.lastMessage.sendAt;
    if (typeof sentAt !== 'string') throw new Error('채팅방 응답 형식이 올바르지 않습니다.');
    lastMessage = { preview: value.lastMessage.preview, sentAt };
  }

  return {
    createdAt: value.createdAt,
    lastMessage,
    otherMember: {
      memberId: otherMember.memberId,
      nickname: otherMember.nickname,
      profileImageUrl: otherMember.profileImageUrl,
    },
    roomId: value.roomId,
    trade: {
      status: status as ChatRoomSummary['trade']['status'],
      thumbnailUrl: trade.thumbnailUrl,
      title: trade.title,
      tradeId: trade.tradeId,
    },
    unreadCount: value.unreadCount,
  };
}

export async function getChatRooms(signal?: AbortSignal): Promise<ChatRoomSummary[]> {
  const data = await readData(
    await authenticatedFetch(`${ROOMS_PATH}/me`, { signal }),
    '채팅방 목록을 불러오지 못했습니다.',
  );
  if (!isRecord(data) || !Array.isArray(data.rooms)) {
    throw new Error('채팅방 목록 응답 형식이 올바르지 않습니다.');
  }
  return data.rooms.map(parseChatRoom);
}

export async function getChatRoom(roomId: number, signal?: AbortSignal): Promise<ChatRoomSummary> {
  assertPositiveInteger(roomId, '채팅방 ID');
  const data = await readData(
    await authenticatedFetch(`${ROOMS_PATH}/${roomId}`, { signal }),
    '채팅방을 불러오지 못했습니다.',
  );
  return parseChatRoom(data);
}

export async function getChatMessages(
  roomId: number,
  { lastSequence, pageSize = 20, signal }: { lastSequence?: number; pageSize?: number; signal?: AbortSignal } = {},
): Promise<ChatMessagePage> {
  assertPositiveInteger(roomId, '채팅방 ID');
  if (lastSequence !== undefined) assertPositiveInteger(lastSequence, '메시지 순서');
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0 || pageSize > 100) {
    throw new Error('메시지는 한 번에 1개에서 100개까지 불러올 수 있습니다.');
  }
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (lastSequence !== undefined) params.set('lastSequence', String(lastSequence));
  const data = await readData(
    await authenticatedFetch(`${ROOMS_PATH}/${roomId}/messages?${params}`, { signal }),
    '메시지를 불러오지 못했습니다.',
  );
  if (
    !isRecord(data) ||
    !Array.isArray(data.messages) ||
    typeof data.hasNext !== 'boolean' ||
    !(data.nextLastSequence === null || isPositiveInteger(data.nextLastSequence))
  ) throw new Error('메시지 응답 형식이 올바르지 않습니다.');
  return {
    hasNext: data.hasNext,
    messages: data.messages.map(parseChatMessage),
    nextLastSequence: data.nextLastSequence,
  };
}

export async function findChatRoomByTrade(tradeId: number): Promise<number | null> {
  assertPositiveInteger(tradeId, '교환글 ID');
  const data = await readData(
    await authenticatedFetch(`${ROOMS_PATH}/existence?tradeId=${tradeId}`),
    '기존 채팅방을 확인하지 못했습니다.',
  );
  if (!isRecord(data) || typeof data.isExist !== 'boolean' || !(data.roomId === null || isPositiveInteger(data.roomId))) {
    throw new Error('채팅방 확인 응답 형식이 올바르지 않습니다.');
  }
  if ((data.isExist && data.roomId === null) || (!data.isExist && data.roomId !== null)) {
    throw new Error('채팅방 확인 응답 형식이 올바르지 않습니다.');
  }
  return data.roomId;
}

export async function createChatRoom(tradeId: number): Promise<number> {
  assertPositiveInteger(tradeId, '교환글 ID');
  const data = await readData(
    await authenticatedFetch(ROOMS_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId }),
    }),
    '채팅방을 만들지 못했습니다.',
  );
  if (!isRecord(data) || !isPositiveInteger(data.roomId)) {
    throw new Error('생성된 채팅방 정보를 확인하지 못했습니다.');
  }
  return data.roomId;
}

export async function markChatMessagesRead(roomId: number, lastReadSequence: number): Promise<void> {
  assertPositiveInteger(roomId, '채팅방 ID');
  assertPositiveInteger(lastReadSequence, '메시지 순서');
  const response = await authenticatedFetch(`${ROOMS_PATH}/${roomId}/messages/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastReadSequence }),
  });
  if (!response.ok) throw new Error('메시지를 읽음 처리하지 못했습니다.');
}

export async function getUnreadChatCount(signal?: AbortSignal): Promise<number> {
  const data = await readData(
    await authenticatedFetch(`${ROOMS_PATH}/unread-count`, { signal }),
    '읽지 않은 채팅 수를 불러오지 못했습니다.',
  );
  if (!isRecord(data) || !isNonNegativeInteger(data.unreadCount)) {
    throw new Error('채팅 개수 응답 형식이 올바르지 않습니다.');
  }
  return data.unreadCount;
}

export async function uploadChatImages(images: readonly ChatImageUpload[]): Promise<ChatMessageFile[]> {
  if (images.length === 0 || images.length > 10) {
    throw new Error('사진은 한 번에 최대 10장까지 보낼 수 있어요.');
  }
  const formData = new FormData();
  images.forEach((image) => {
    formData.append('files', {
      uri: image.uri,
      name: image.fileName,
      type: image.mimeType,
    } as unknown as Blob);
  });
  const data = await readData(
    await authenticatedFetch('/api/v1/files', { method: 'POST', body: formData }),
    '사진을 업로드하지 못했습니다.',
  );
  if (!isRecord(data) || !Array.isArray(data.files)) {
    throw new Error('사진 업로드 응답 형식이 올바르지 않습니다.');
  }
  const files = data.files.map(parseFile);
  if (files.length !== images.length) throw new Error('업로드된 사진 정보를 확인하지 못했습니다.');
  return files;
}
