export interface PushNavigationQueue {
  markLoading(): void;
  markReady(): string | null;
  request(path: string): string | null;
}

/**
 * WebView가 문서를 교체하는 동안 푸시 목적지 이동이 유실되지 않도록 보관한다.
 * 로딩 중 여러 알림을 누르면 사용자가 마지막으로 선택한 목적지를 우선한다.
 */
export function createPushNavigationQueue(): PushNavigationQueue {
  let isReady = false;
  let pendingPath: string | null = null;

  return {
    markLoading() {
      isReady = false;
    },
    markReady() {
      isReady = true;

      const path = pendingPath;
      pendingPath = null;
      return path;
    },
    request(path) {
      if (isReady) {
        return path;
      }

      pendingPath = path;
      return null;
    },
  };
}
