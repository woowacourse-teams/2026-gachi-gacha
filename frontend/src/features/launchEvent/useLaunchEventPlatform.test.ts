import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useLaunchEventPlatform } from './useLaunchEventPlatform';

afterEach(() => {
  delete document.documentElement.dataset.gachigachaNativePlatform;
  delete window.ReactNativeWebView;
  jest.useRealTimers();
});

describe('이벤트 앱 환경 관찰', () => {
  it('초기 앱 표식이 있으면 지연 없이 앱으로 판단한다', () => {
    document.documentElement.dataset.gachigachaNativePlatform = 'android';
    const { result } = renderHook(useLaunchEventPlatform);
    expect(result.current.platform).toBe('android');
  });

  it('표식이 없는 초기 상태는 확인 중이며 유예 후 웹으로 판단한다', () => {
    jest.useFakeTimers();
    const { result, unmount } = renderHook(useLaunchEventPlatform);
    expect(result.current.platform).toBeNull();
    act(() => jest.advanceTimersByTime(500));
    expect(result.current.platform).toBe('web');
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('늦게 주입되거나 바뀐 앱 표식을 관찰한다', async () => {
    const { result } = renderHook(useLaunchEventPlatform);
    await act(async () => {
      document.documentElement.dataset.gachigachaNativePlatform = 'ios';
    });
    await waitFor(() => expect(result.current.platform).toBe('ios'));
    await act(async () => {
      delete document.documentElement.dataset.gachigachaNativePlatform;
    });
    await waitFor(() => expect(result.current.platform).toBe('web'));
  });

  it('DOM 변경 없는 브리지 주입도 다음 초기 검사에서 반영한다', () => {
    jest.useFakeTimers();
    const { result } = renderHook(useLaunchEventPlatform);
    act(() => jest.advanceTimersByTime(500));
    window.ReactNativeWebView = { postMessage: jest.fn() };
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.platform).toBe('app-unknown');
  });

  it('화면 복귀 및 클릭 시 현재 환경을 다시 확인한다', async () => {
    const { result } = renderHook(useLaunchEventPlatform);
    window.ReactNativeWebView = { postMessage: jest.fn() };
    act(() => window.dispatchEvent(new Event('pageshow')));
    expect(result.current.platform).toBe('app-unknown');
    await act(async () => {
      document.documentElement.dataset.gachigachaNativePlatform = 'ios';
      expect(result.current.refreshPlatform()).toBe('ios');
    });
    expect(result.current.platform).toBe('ios');
  });
});
