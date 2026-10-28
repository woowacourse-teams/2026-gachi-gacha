import { useCallback, useEffect, useRef } from 'react';

import { markChatMessagesRead } from '@/domains/chat/api/chatApi';

export const CHAT_READ_DEBOUNCE_MS = 500;

function sendReadMark(roomId: number, sequence: number) {
  void markChatMessagesRead(roomId, sequence).catch(() => {
    // 읽음 처리 실패가 대화를 막지 않도록 다음 메시지나 재진입 때 다시 보냅니다.
  });
}

/**
 * 열린 채팅방에서 받은 메시지를 서버에 읽음 처리합니다.
 * 메시지가 연달아 오면 마지막 sequence만 모아 한 번에 보냅니다.
 */
export function useChatReadMarker(roomId: number | undefined) {
  const pendingSequenceRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      const pendingSequence = pendingSequenceRef.current;

      pendingSequenceRef.current = null;

      // 방을 나가거나 바꿀 때 기다리던 읽음 처리를 버리지 않고 바로 보냅니다.
      if (roomId !== undefined && pendingSequence !== null) {
        sendReadMark(roomId, pendingSequence);
      }
    },
    [roomId],
  );

  return useCallback(
    (sequence: number) => {
      if (roomId === undefined) {
        return;
      }

      pendingSequenceRef.current = Math.max(
        pendingSequenceRef.current ?? sequence,
        sequence,
      );

      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }

      timeoutIdRef.current = window.setTimeout(() => {
        const pendingSequence = pendingSequenceRef.current;

        pendingSequenceRef.current = null;
        timeoutIdRef.current = null;

        if (pendingSequence !== null) {
          sendReadMark(roomId, pendingSequence);
        }
      }, CHAT_READ_DEBOUNCE_MS);
    },
    [roomId],
  );
}
