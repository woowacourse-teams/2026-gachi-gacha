import type { BottomSheetState } from './storeDetail';

export type VisibleBottomSheetState = Exclude<BottomSheetState, 'closed'>;

const expandedStates: VisibleBottomSheetState[] = [
  'collapsed',
  'summary',
  'full',
];

export function getExpandedBottomSheetState(state: BottomSheetState) {
  if (state === 'closed' || state === 'full') return state;

  const currentIndex = expandedStates.indexOf(state);

  return expandedStates[currentIndex + 1] ?? state;
}

export function getCollapsedBottomSheetState(state: BottomSheetState) {
  if (state === 'closed') return state;
  if (state === 'collapsed') return 'closed';

  const currentIndex = expandedStates.indexOf(state);

  return expandedStates[currentIndex - 1] ?? state;
}

export function getBottomSheetStateLabel(state: BottomSheetState) {
  const labels: Record<BottomSheetState, string> = {
    closed: '닫힘',
    collapsed: '간단 정보',
    summary: '요약 정보',
    full: '전체 정보',
  };

  return labels[state];
}
