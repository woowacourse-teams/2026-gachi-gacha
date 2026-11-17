import { isInNativeApp } from '@/features/pushNotifications/nativePushBridge';

export type LaunchEventPlatform = 'web' | 'android' | 'ios' | 'app-unknown';

export function isLaunchEventApp(
  platform: LaunchEventPlatform | null,
): platform is 'android' | 'ios' {
  return platform === 'android' || platform === 'ios';
}

/** 참여 경로만 구분한다. 앱 설치나 참여 자격을 증명하는 보안 검증이 아니다. */
export function getLaunchEventPlatform(): LaunchEventPlatform {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'web';
  }

  const explicitPlatform =
    document.documentElement.dataset.gachigachaNativePlatform;
  if (explicitPlatform === 'android' || explicitPlatform === 'ios') {
    return explicitPlatform;
  }

  // 모바일 브라우저의 운영체제만으로 앱이라고 판단하지 않는다.
  if (!isInNativeApp()) return 'web';
  if (typeof navigator === 'undefined') return 'app-unknown';

  if (/Android/i.test(navigator.userAgent)) return 'android';
  if (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) {
    return 'ios';
  }

  return 'app-unknown';
}
