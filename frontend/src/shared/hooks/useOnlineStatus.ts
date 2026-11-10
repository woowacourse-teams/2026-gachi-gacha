import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);

  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/** 브라우저가 인터넷에 연결돼 있는지 구독한다. 알 수 없는 환경에서는 연결된 것으로 본다. */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof navigator === 'undefined' ? true : navigator.onLine),
    () => true,
  );
}
