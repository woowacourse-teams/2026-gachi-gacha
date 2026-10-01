function padTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`;
}

/** 메시지 시각을 사용자 기준 날짜 키(YYYY-MM-DD)로 바꿉니다. 형식이 잘못되면 빈 문자열입니다. */
export function toChatDateKey(dateTime: string): string {
  const date = new Date(dateTime);

  return Number.isNaN(date.getTime()) ? '' : toDateKey(date);
}

/** 날짜 구분선 문구: 오늘, 어제, 같은 해는 M월 D일, 그 외는 YYYY년 M월 D일 */
export function formatChatDateLabel(dateKey: string, now = new Date()): string {
  const [year, month, day] = dateKey.split('-').map(Number);

  if (!year || !month || !day) {
    return '';
  }

  const yesterday = new Date(now);

  yesterday.setDate(now.getDate() - 1);

  if (dateKey === toDateKey(now)) {
    return '오늘';
  }

  if (dateKey === toDateKey(yesterday)) {
    return '어제';
  }

  return year === now.getFullYear()
    ? `${month}월 ${day}일`
    : `${year}년 ${month}월 ${day}일`;
}
