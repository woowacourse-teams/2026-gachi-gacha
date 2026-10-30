export type PushNotificationDestination = {
  notificationId: number | null;
  path: string;
  type: 'chat' | 'comment';
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readPositiveInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function resolvePushNotificationDestination(
  data: unknown,
): PushNotificationDestination | null {
  if (!isRecord(data) || typeof data.type !== 'string') {
    return null;
  }

  const type = data.type.trim().toUpperCase();

  if (type === 'CHAT') {
    const roomId = readPositiveInteger(data.roomId);
    return roomId
      ? { notificationId: null, path: `/chat/${roomId}`, type: 'chat' }
      : null;
  }

  if (type === 'COMMENT') {
    const tradeId = readPositiveInteger(data.tradeId);
    const notificationId = readPositiveInteger(data.notificationId);
    return tradeId
      ? {
          notificationId,
          path: `/trade/${tradeId}`,
          type: 'comment',
        }
      : null;
  }

  return null;
}
