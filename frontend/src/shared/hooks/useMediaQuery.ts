import { useSyncExternalStore } from 'react';

function canMatchMedia(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  );
}

/** 미디어 쿼리 일치 여부를 구독한다. matchMedia가 없는 환경에서는 false로 본다. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!canMatchMedia()) {
        return () => undefined;
      }

      const mediaQueryList = window.matchMedia(query);

      mediaQueryList.addEventListener('change', onChange);
      return () => mediaQueryList.removeEventListener('change', onChange);
    },
    () => canMatchMedia() && window.matchMedia(query).matches,
    () => false,
  );
}
