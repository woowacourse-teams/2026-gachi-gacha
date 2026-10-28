const MINUTE_IN_MILLISECONDS = 60 * 1000;
const HOUR_IN_MILLISECONDS = 60 * MINUTE_IN_MILLISECONDS;
const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS;
const MONTH_IN_MILLISECONDS = 30 * DAY_IN_MILLISECONDS;
const YEAR_IN_MILLISECONDS = 365 * DAY_IN_MILLISECONDS;

export function formatRelativeTime(dateTime: string, now = Date.now()): string {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return '등록일 확인 중';
  }

  const elapsedTime = Math.max(0, now - date.getTime());

  if (elapsedTime < MINUTE_IN_MILLISECONDS) {
    return '방금 전';
  }

  if (elapsedTime < HOUR_IN_MILLISECONDS) {
    return `${Math.floor(elapsedTime / MINUTE_IN_MILLISECONDS)}분 전`;
  }

  if (elapsedTime < DAY_IN_MILLISECONDS) {
    return `${Math.floor(elapsedTime / HOUR_IN_MILLISECONDS)}시간 전`;
  }

  if (elapsedTime < MONTH_IN_MILLISECONDS) {
    return `${Math.floor(elapsedTime / DAY_IN_MILLISECONDS)}일 전`;
  }

  if (elapsedTime < YEAR_IN_MILLISECONDS) {
    return `${Math.floor(elapsedTime / MONTH_IN_MILLISECONDS)}개월 전`;
  }

  return `${Math.floor(elapsedTime / YEAR_IN_MILLISECONDS)}년 전`;
}
