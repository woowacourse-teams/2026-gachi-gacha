import type { BottomSheetState } from './storeDetail';

export type VisibleBottomSheetState = Exclude<BottomSheetState, 'closed'>;

const expandedStates: VisibleBottomSheetState[] = [
  'collapsed',
  'summary',
  'full',
];

/**
 * 각 단계에서 시트의 윗변이 놓이는 위치. 부모(지도 영역) 높이 기준이다.
 *
 * 스타일과 지도 이동 계산이 같은 값을 봐야 해서 한 곳에 둔다. 스타일에만 두면
 * 디자인이 바뀔 때 지도가 조용히 어긋난다.
 */
const sheetTop: Record<BottomSheetState, { percent: number; px: number }> = {
  closed: { percent: 100, px: 0 },
  collapsed: { percent: 100, px: -116 },
  summary: { percent: 47, px: 0 },
  full: { percent: 0, px: 12 },
};

/** 시트의 `top`에 넣을 CSS 값. 드래그 중이면 그만큼 따라 움직인다. */
export function getBottomSheetTop(state: BottomSheetState, dragOffset = 0) {
  const { percent, px } = sheetTop[state];
  const offset = px + dragOffset;
  const sign = offset < 0 ? '-' : '+';

  return `calc(${percent}% ${sign} ${Math.abs(offset)}px)`;
}

/** 시트가 화면 아래쪽을 덮는 높이(px). 지도를 얼마나 밀지 계산할 때 쓴다. */
export function getBottomSheetCoveredHeight(
  state: BottomSheetState,
  containerHeight: number,
) {
  const { percent, px } = sheetTop[state];
  const top = (containerHeight * percent) / 100 + px;

  return Math.max(0, containerHeight - top);
}

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
