import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const DEFAULT_BOTTOM_CONTENT_GAP = 24;

export function resolveBottomContentPadding(
  bottomInset: number,
  contentGap = DEFAULT_BOTTOM_CONTENT_GAP,
): number {
  return Math.max(0, bottomInset) + Math.max(0, contentGap);
}

/**
 * Android edge-to-edge 화면에서 시스템 내비게이션 바를 사용자 뷰의
 * 최하단으로 취급하기 위한 공통 하단 여백이다.
 */
export function useBottomContentPadding(
  contentGap = DEFAULT_BOTTOM_CONTENT_GAP,
): number {
  const { bottom } = useSafeAreaInsets();
  return resolveBottomContentPadding(bottom, contentGap);
}
