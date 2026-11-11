export const LAUNCH_EVENT_PATH = '/events/app-launch';

/** 이미지 교체는 이곳의 경로와 대체 텍스트만 바꾼다. 날짜는 접수 환경변수와 분리하지 않는다. */
export const LAUNCH_EVENT_CONTENT = {
  title: '가치가챠 앱 출시 기념 가챠 선물 이벤트',
  shortTitle: '가챠 선물 이벤트',
  provisionalDeadline: '2026년 11월 24일',
  announcement: '2026년 11월 27일 예정',
  prizeImage: '/images/events/app-launch/chiikawa-desktop-figure-prizes.png',
  prizeImageAlt: '치이카와 데스크톱 피규어 경품 4종',
  prizeGuideImage: '/images/events/app-launch/giveaway-eight-winners.png',
  prizeGuideImageAlt:
    '가챠 4종 각 2개, 종류별 2명씩 총 8명을 추첨하여 1인 1개 랜덤 증정',
  prizeCaption: '가챠 4종 · 각 2개 · 총 8명',
} as const;

export function formatLaunchEventDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '추후 안내';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function getLaunchEventDday(endAt: string, now: Date): string {
  const end = Date.parse(endAt);
  if (!Number.isFinite(end) || end <= now.getTime()) return '마감';
  // endAt은 배타적 마감이다. 11/25 00:00이면 마지막 응모 가능일은 11/24다.
  const day = (timestamp: number) =>
    Math.floor((timestamp + 9 * 60 * 60 * 1000) / 86_400_000);
  const remaining = day(end - 1) - day(now.getTime());
  return remaining === 0 ? 'D-DAY' : `D-${remaining}`;
}
