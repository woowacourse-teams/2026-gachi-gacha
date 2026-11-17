import { useEffect, useState } from 'react';

import {
  getLaunchEventPlatform,
  type LaunchEventPlatform,
} from './launchEventPlatform';

/** 늦게 주입되는 WebView 표식 때문에 첫 렌더부터 웹으로 단정하지 않는다. */
export function useLaunchEventPlatform() {
  const [platform, setPlatform] = useState<LaunchEventPlatform | null>(() => {
    const initial = getLaunchEventPlatform();
    return initial === 'web' ? null : initial;
  });

  useEffect(() => {
    const refresh = () => setPlatform(getLaunchEventPlatform());
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-gachigacha-native-platform'],
    });
    // 브리지 객체 주입은 DOM 변경이 아니므로 초기 유예와 복귀 시에도 재확인한다.
    const initialCheck = window.setTimeout(refresh, 500);
    const lateCheck = window.setTimeout(refresh, 1500);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      observer.disconnect();
      window.clearTimeout(initialCheck);
      window.clearTimeout(lateCheck);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const refreshPlatform = () => {
    const current = getLaunchEventPlatform();
    setPlatform(current);
    return current;
  };
  return { platform, refreshPlatform };
}
