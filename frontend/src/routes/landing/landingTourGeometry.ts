export const LANDING_TOUR_TARGETS = [
  'create',
  'map',
  'search',
  'chat',
  'notification',
] as const;

export type LandingTourTarget = (typeof LANDING_TOUR_TARGETS)[number];

export interface SnapshotSize {
  height: number;
  width: number;
}

export interface SnapshotTargetRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export const DESKTOP_SNAPSHOT_SIZE = { width: 1440, height: 900 } as const;
export const MOBILE_SNAPSHOT_SIZE = { width: 390, height: 720 } as const;

function createCenteredTargetRect(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
): SnapshotTargetRect {
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

// 스냅샷 원본에서 측정한 버튼 중심과 버튼 주변의 대칭 여백입니다.
export const DESKTOP_TARGET_RECTS: Record<
  LandingTourTarget,
  SnapshotTargetRect
> = {
  create: createCenteredTargetRect(1371, 846, 84, 84),
  map: createCenteredTargetRect(1153, 38, 98, 60),
  search: createCenteredTargetRect(1241, 38, 100, 60),
  chat: createCenteredTargetRect(1276, 37, 58, 58),
  notification: createCenteredTargetRect(1324, 37, 58, 58),
};

export const MOBILE_TARGET_RECTS: Record<
  LandingTourTarget,
  SnapshotTargetRect
> = {
  create: createCenteredTargetRect(331, 676, 78, 78),
  map: createCenteredTargetRect(141, 29, 72, 52),
  search: createCenteredTargetRect(203, 29, 72, 52),
  chat: createCenteredTargetRect(269, 29, 56, 56),
  notification: createCenteredTargetRect(307, 29, 56, 56),
};
