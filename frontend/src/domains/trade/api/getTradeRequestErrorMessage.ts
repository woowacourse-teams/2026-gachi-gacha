const PAYLOAD_TOO_LARGE_STATUS = 413;

export const PAYLOAD_TOO_LARGE_MESSAGE =
  '사진 용량이 너무 커서 업로드하지 못했어요. 사진 수나 크기를 줄여 다시 시도해주세요.';

const FIELD_LABELS: Record<string, string> = {
  title: '제목',
  description: '설명',
  desiredProduction: '교환 희망 상품',
  categoryIds: '카테고리',
  purchaseStore: '구매 매장',
  tradePlace: '교환 장소',
  availableTime: '교환 가능 일시',
};

interface FieldErrorDetail {
  field: string;
  reason: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFieldErrorDetail(value: unknown): value is FieldErrorDetail {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.reason === 'string'
  );
}

// purchaseStore.address처럼 중첩된 필드는 최상위 항목 이름으로 안내한다.
function formatFieldError({ field, reason }: FieldErrorDetail): string {
  const label = FIELD_LABELS[field.split('.')[0] ?? field];

  return label ? `${label}: ${reason}` : reason;
}

/**
 * 교환 글 등록·수정 실패 응답을 사용자 안내 문구로 바꾼다.
 * - 413: 프록시(nginx)가 JSON이 아닌 HTML로 응답하므로 상태 코드로 판단한다.
 * - 400 검증 실패: 백엔드가 errors[]에 항목별 사유를 담아 주므로 항목 이름과 함께 보여준다.
 */
export function getTradeRequestErrorMessage(
  status: number,
  body: unknown,
  fallbackMessage: string,
): string {
  if (status === PAYLOAD_TOO_LARGE_STATUS) {
    return PAYLOAD_TOO_LARGE_MESSAGE;
  }

  if (!isRecord(body)) {
    return fallbackMessage;
  }

  const fieldErrors = Array.isArray(body.errors)
    ? body.errors.filter(isFieldErrorDetail)
    : [];

  if (fieldErrors.length > 0) {
    return fieldErrors.map(formatFieldError).join('\n');
  }

  return typeof body.message === 'string' ? body.message : fallbackMessage;
}
