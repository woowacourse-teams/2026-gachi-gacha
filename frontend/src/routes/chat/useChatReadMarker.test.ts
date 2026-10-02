import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import { markChatMessagesRead } from '@/domains/chat/api/chatApi';

import { CHAT_READ_DEBOUNCE_MS, useChatReadMarker } from './useChatReadMarker';

jest.mock('@/domains/chat/api/chatApi', () => ({
  markChatMessagesRead: jest.fn(() => Promise.resolve()),
}));

const markReadMock = jest.mocked(markChatMessagesRead);

describe('useChatReadMarker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    markReadMock.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('연달아 받은 메시지는 debounce 후 가장 큰 sequence로 한 번만 읽음 처리한다', () => {
    const { result } = renderHook(() => useChatReadMarker(1));

    act(() => {
      result.current(23);
      result.current(25);
      result.current(24);
    });

    expect(markReadMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(CHAT_READ_DEBOUNCE_MS);
    });

    expect(markReadMock).toHaveBeenCalledTimes(1);
    expect(markReadMock).toHaveBeenCalledWith(1, 25);
  });

  it('채팅방을 바꾸거나 나가면 기다리던 읽음 처리를 바로 보낸다', () => {
    const { result, rerender, unmount } = renderHook(
      ({ roomId }) => useChatReadMarker(roomId),
      { initialProps: { roomId: 1 } },
    );

    act(() => {
      result.current(30);
    });
    rerender({ roomId: 2 });

    expect(markReadMock).toHaveBeenCalledWith(1, 30);

    act(() => {
      result.current(5);
    });
    unmount();

    expect(markReadMock).toHaveBeenLastCalledWith(2, 5);
    expect(markReadMock).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(CHAT_READ_DEBOUNCE_MS);
    });

    expect(markReadMock).toHaveBeenCalledTimes(2);
  });

  it('열린 채팅방이 없으면 읽음 처리하지 않는다', () => {
    const { result } = renderHook(() => useChatReadMarker(undefined));

    act(() => {
      result.current(10);
      jest.advanceTimersByTime(CHAT_READ_DEBOUNCE_MS);
    });

    expect(markReadMock).not.toHaveBeenCalled();
  });
});
