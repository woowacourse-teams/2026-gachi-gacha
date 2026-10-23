import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { isApiResponse } from '@/shared/api/isApiResponse';

import { MAX_CHAT_IMAGE_COUNT } from '../chatImagePolicy';
import type {
  ChatMessage,
  ChatMessageFile,
  ChatMessagePage,
  ChatRoomSummary,
} from '../chatType';

const CHAT_ROOMS_PATH = '/api/v1/chat/rooms';
const JSON_CONTENT_TYPE = 'application/json';
const FILE_UPLOAD_PATH = '/api/v1/files';

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

  return Array.isArray(data.rooms) ? data.rooms.map(normalizeRoom) : [];
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

  return normalizeRoom(data);
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

export async function uploadChatImages(
  files: readonly File[],
): Promise<ChatMessageFile[]> {
  if (files.length === 0 || files.length > MAX_CHAT_IMAGE_COUNT) {
    throw new Error(
      `사진은 한 번에 최대 ${MAX_CHAT_IMAGE_COUNT}장까지 보낼 수 있어요.`,
    );
  }

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await authenticatedFetch(FILE_UPLOAD_PATH, {
    method: 'POST',
    body: formData,
  });

  if (!response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('사진 업로드 응답을 확인하지 못했습니다.');
  }

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(body, '사진을 업로드하지 못했습니다.'));
  }

  if (!isApiResponse(body) || !isRecord(body.data)) {
    throw new Error('사진 업로드 응답 형식이 올바르지 않습니다.');
  }

  const uploadedFiles = Array.isArray(body.data.files)
    ? body.data.files.filter(isChatMessageFile)
    : [];

  if (uploadedFiles.length !== files.length) {
    throw new Error('업로드된 사진 정보를 확인하지 못했습니다.');
  }

  return uploadedFiles;
}

function validatePositiveId(id: number, subject: string): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`올바른 ${subject} ID가 필요합니다.`);
  }
}

function normalizeRoom(room: ChatRoomSummary): ChatRoomSummary {
  return {
    ...room,
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

interface ChatLastMessageWire {
  sendAt?: string;
}

function normalizeMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    messageId: String(message.messageId),
    content: typeof message.content === 'string' ? message.content : null,
    files: Array.isArray(message.files)
      ? message.files.filter(isChatMessageFile)
      : [],
  };
}

function isChatMessageFile(value: unknown): value is ChatMessageFile {
  return (
    isRecord(value) &&
    typeof value.url === 'string' &&
    value.url.length > 0 &&
    typeof value.originalName === 'string' &&
    (typeof value.contentType === 'string' || value.contentType === null) &&
    typeof value.size === 'number'
  );
}
