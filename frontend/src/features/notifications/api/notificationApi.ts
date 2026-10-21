import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { isApiResponse } from '@/shared/api/isApiResponse';

const NOTIFICATIONS_API_PATH = '/api/v1/notifications';
const JSON_CONTENT_TYPE = 'application/json';

interface NotificationResponseItem {
  notificationId: number;
  type: 'COMMENT';
  title: string;
  body: string;
  tradeId: number;
  commentId: number;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  notifications: readonly NotificationResponseItem[];
  nextLastNotificationId: number | null;
  hasNext: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function parseNotification(value: unknown): NotificationResponseItem {
  if (!isRecord(value)) {
    throw new Error('알림 응답 형식이 올바르지 않습니다.');
  }

  const {
    notificationId,
    type,
    title,
    body,
    tradeId,
    commentId,
    read,
    createdAt,
  } = value;

  if (
    !isPositiveInteger(notificationId) ||
    type !== 'COMMENT' ||
    typeof title !== 'string' ||
    typeof body !== 'string' ||
    !isPositiveInteger(tradeId) ||
    !isPositiveInteger(commentId) ||
    typeof read !== 'boolean' ||
    typeof createdAt !== 'string'
  ) {
    throw new Error('알림 응답 형식이 올바르지 않습니다.');
  }

  return {
    notificationId,
    type,
    title,
    body,
    tradeId,
    commentId,
    read,
    createdAt,
  };
}

async function readJsonResponse(
  response: Response,
  fallbackMessage: string,
): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)) {
    throw new Error(fallbackMessage);
  }

  const responseBody: unknown = await response.json();

  if (!response.ok || !isApiResponse(responseBody)) {
    throw new Error(
      isApiResponse(responseBody) ? responseBody.message : fallbackMessage,
    );
  }

  return responseBody;
}

export async function getNotifications(
  signal?: AbortSignal,
): Promise<NotificationPage> {
  const searchParams = new URLSearchParams({ size: '20' });
  const response = await authenticatedFetch(
    `${NOTIFICATIONS_API_PATH}?${searchParams.toString()}`,
    { signal: signal ?? null },
  );
  const responseBody = await readJsonResponse(
    response,
    '알림을 불러오지 못했습니다.',
  );

  if (!isApiResponse(responseBody) || !isRecord(responseBody.data)) {
    throw new Error('알림 응답 형식이 올바르지 않습니다.');
  }

  const { notifications, nextLastNotificationId, hasNext } = responseBody.data;

  if (
    !Array.isArray(notifications) ||
    !(
      nextLastNotificationId === null ||
      isPositiveInteger(nextLastNotificationId)
    ) ||
    typeof hasNext !== 'boolean'
  ) {
    throw new Error('알림 응답 형식이 올바르지 않습니다.');
  }

  return {
    notifications: notifications.map(parseNotification),
    nextLastNotificationId,
    hasNext,
  };
}

export async function getUnreadNotificationCount(
  signal?: AbortSignal,
): Promise<number> {
  const response = await authenticatedFetch(
    `${NOTIFICATIONS_API_PATH}/unread-count`,
    { signal: signal ?? null },
  );
  const responseBody = await readJsonResponse(
    response,
    '읽지 않은 알림 개수를 불러오지 못했습니다.',
  );

  if (!isApiResponse(responseBody) || !isRecord(responseBody.data)) {
    throw new Error('알림 개수 응답 형식이 올바르지 않습니다.');
  }

  const { unreadCount } = responseBody.data;

  if (!Number.isInteger(unreadCount) || Number(unreadCount) < 0) {
    throw new Error('알림 개수 응답 형식이 올바르지 않습니다.');
  }

  return Number(unreadCount);
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  const response = await authenticatedFetch(
    `${NOTIFICATIONS_API_PATH}/${notificationId}/read`,
    { method: 'PATCH' },
  );
  const responseBody = await readJsonResponse(
    response,
    '알림을 읽음 처리하지 못했습니다.',
  );

  if (!isApiResponse(responseBody) || responseBody.code !== 'C002') {
    throw new Error(
      isApiResponse(responseBody)
        ? responseBody.message
        : '알림을 읽음 처리하지 못했습니다.',
    );
  }
}
