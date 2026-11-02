import assert from 'node:assert/strict';
import test from 'node:test';

import { createPushNavigationQueue } from '../src/domains/notification/pushNavigationQueue.ts';
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

test('WebView 최초 로딩 전 푸시 경로는 준비될 때까지 보존한다', () => {
  const queue = createPushNavigationQueue();

  assert.equal(queue.request('/trade/17'), null);
  assert.equal(queue.markReady(), '/trade/17');
  assert.equal(queue.markReady(), null);
});

test('준비된 WebView의 푸시 경로는 즉시 이동한다', () => {
  const queue = createPushNavigationQueue();
  queue.markReady();

  assert.equal(queue.request('/chat/25'), '/chat/25');
  assert.equal(queue.markReady(), null);
});

test('WebView 재로딩 중에는 마지막으로 선택한 푸시 경로를 이동한다', () => {
  const queue = createPushNavigationQueue();
  queue.markReady();
  queue.markLoading();

  assert.equal(queue.request('/trade/17'), null);
  assert.equal(queue.request('/chat/25'), null);
  assert.equal(queue.markReady(), '/chat/25');
});
