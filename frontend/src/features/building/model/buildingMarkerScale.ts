/**
 * 지도를 넓힐수록 건물 마커를 줄인다.
 *
 * 매장 마커는 점이라 어느 배율에서나 같은 크기로 둔다. 건물 마커는 다르다.
 * 실제로 자리를 차지하는 건물 한 동을 대신하는 그림이라, 크기를 고정해 두면
 * 지도를 넓혔을 때 건물 하나가 동네 몇 블록을 덮는다.
 *
 * 카카오 지도는 레벨이 1 오를 때마다 1px 이 담는 거리가 두 배가 된다.
 * 실제 축척을 그대로 따라가면(레벨당 1/2) 조금만 넓혀도 알아볼 수 없이
 * 작아진다. 레벨당 1/√2 로 완만하게 줄이고 아래에서 한 번 자른다.
 */

/** `KakaoMap` 의 `defaultLevel`. 이 레벨에서 그림이 원래 크기로 나온다. */
const BASE_LEVEL = 4;

/** 레벨 하나당 줄어드는 비율. 1/2 이면 실제 축척, 1 이면 고정 크기. */
const SHRINK_PER_LEVEL = Math.SQRT1_2;

/**
 * 더 줄이지 않는 하한.
 *
 * 이 아래로 내려가면 건물인지 알아볼 수 없고, 눌러야 할 대상이 손가락보다
 * 작아진다. 원래 크기의 40% 면 가로가 약 40px 이라 아직 잡힌다.
 */
const MIN_SCALE = 0.4;

/** 가까이 당겨도 그림보다 크게 그리지는 않는다. 확대하면 래스터가 뭉갠다. */
const MAX_SCALE = 1;

export function getBuildingMarkerScale(level: number) {
  const scale = SHRINK_PER_LEVEL ** (level - BASE_LEVEL);

  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}
