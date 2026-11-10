const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
});
const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatConversationTime(
  value: string,
  now = new Date(),
): string {
  // 오프셋 없는 서버 시각은 한국 매장 서비스의 시간대로 해석한다.
  const normalized =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)
      ? `${value}+09:00`
      : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  const day = dayFormat.format(date);
  if (day === dayFormat.format(now)) return timeFormat.format(date);
  if (day === dayFormat.format(new Date(now.getTime() - 24 * 60 * 60 * 1000)))
    return '어제';
  return dateFormat.format(date);
}
