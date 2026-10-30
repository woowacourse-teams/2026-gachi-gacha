import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePushNotificationDestination } from '../src/domains/notification/pushNotificationRouting.ts';

test('댓글 푸시는 교환글 상세 경로와 알림 ID를 만든다', () => {
  assert.deepEqual(
    resolvePushNotificationDestination({
      type: 'COMMENT',
      notificationId: '41',
      tradeId: '17',
      commentId: '9',
    }),
    {
      notificationId: 41,
      path: '/trade/17',
      type: 'comment',
    },
  );
});

test('채팅 푸시는 채팅방 경로를 만든다', () => {
  assert.deepEqual(
    resolvePushNotificationDestination({ type: 'CHAT', roomId: '25' }),
    { notificationId: null, path: '/chat/25', type: 'chat' },
  );
});

test('지원하지 않거나 조작된 payload는 이동하지 않는다', () => {
  assert.equal(
    resolvePushNotificationDestination({ type: 'CHAT', roomId: '../login' }),
    null,
  );
  assert.equal(
    resolvePushNotificationDestination({ type: 'NOTICE', tradeId: '1' }),
    null,
  );
  assert.equal(resolvePushNotificationDestination(null), null);
});
