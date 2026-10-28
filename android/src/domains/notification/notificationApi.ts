import { authenticatedFetch } from '../auth/authApi';
import type { NotificationItem, NotificationPage } from './notificationTypes';

const API_PATH = '/api/v1/notifications';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

async function readResponse(response: Response, fallback: string): Promise<Record<string, unknown>> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(fallback);
  }
  const body: unknown = await response.json();
  if (!isRecord(body) || !response.ok) {
    throw new Error(isRecord(body) && typeof body.message === 'string' ? body.message : fallback);
  }
  return body;
}

function parseNotification(value: unknown): NotificationItem {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.notificationId) ||
    value.type !== 'COMMENT' ||
    typeof value.title !== 'string' ||
    typeof value.body !== 'string' ||
    !isPositiveInteger(value.tradeId) ||
    !isPositiveInteger(value.commentId) ||
    typeof value.read !== 'boolean' ||
    typeof value.createdAt !== 'string'
  ) {
    throw new Error('알림 응답 형식이 올바르지 않습니다.');
  }

  return {
    body: value.body,
    commentId: value.commentId,
    createdAt: value.createdAt,
    notificationId: value.notificationId,
    read: value.read,
    title: value.title,
    tradeId: value.tradeId,
    type: value.type,
  };
}

export async function getNotifications({
  lastNotificationId,
  signal,
  size = 20,
}: {
  lastNotificationId?: number;
  signal?: AbortSignal;
  size?: number;
} = {}): Promise<NotificationPage> {
  const params = new URLSearchParams({ size: String(size) });
  if (lastNotificationId !== undefined) {
    params.set('lastNotificationId', String(lastNotificationId));
  }
  const body = await readResponse(
    await authenticatedFetch(`${API_PATH}?${params}`, { signal }),
    '알림을 불러오지 못했습니다.',
  );

  if (!isRecord(body.data)) throw new Error('알림 응답 형식이 올바르지 않습니다.');
  const { hasNext, nextLastNotificationId, notifications } = body.data;
  if (
    !Array.isArray(notifications) ||
    typeof hasNext !== 'boolean' ||
    !(nextLastNotificationId === null || isPositiveInteger(nextLastNotificationId))
  ) {
    throw new Error('알림 응답 형식이 올바르지 않습니다.');
  }

  return {
    hasNext,
    nextLastNotificationId,
    notifications: notifications.map(parseNotification),
  };
}

export async function getUnreadNotificationCount(signal?: AbortSignal): Promise<number> {
  const body = await readResponse(
    await authenticatedFetch(`${API_PATH}/unread-count`, { signal }),
    '읽지 않은 알림 개수를 불러오지 못했습니다.',
  );
  if (!isRecord(body.data) || !Number.isInteger(body.data.unreadCount) || Number(body.data.unreadCount) < 0) {
    throw new Error('알림 개수 응답 형식이 올바르지 않습니다.');
  }
  return Number(body.data.unreadCount);
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  const body = await readResponse(
    await authenticatedFetch(`${API_PATH}/${notificationId}/read`, { method: 'PATCH' }),
    '알림을 읽음 처리하지 못했습니다.',
  );
  if (body.code !== 'C002') throw new Error('알림을 읽음 처리하지 못했습니다.');
}

export async function markAllNotificationsRead(): Promise<void> {
  const body = await readResponse(
    await authenticatedFetch(`${API_PATH}/read-all`, { method: 'PATCH' }),
    '알림을 모두 읽음 처리하지 못했습니다.',
  );
  if (body.code !== 'C002') throw new Error('알림을 모두 읽음 처리하지 못했습니다.');
}
