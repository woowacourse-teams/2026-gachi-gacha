import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { isApiResponse } from '@/shared/api/isApiResponse';

export const SUPPORT_INQUIRY_CATEGORIES = [
  'SERVICE',
  'BUG',
  'DATA',
  'OTHER',
] as const;

export type SupportInquiryCategory =
  (typeof SUPPORT_INQUIRY_CATEGORIES)[number];

export interface SupportInquiryRequest {
  category: SupportInquiryCategory;
  content: string;
}

export async function submitSupportInquiry(
  inquiry: SupportInquiryRequest,
): Promise<void> {
  const response = await authenticatedFetch('/api/v1/support-inquiries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inquiry),
  });

  if (response.ok) {
    return;
  }

  const contentType = response.headers.get('content-type');
  const responseBody: unknown = contentType?.includes('application/json')
    ? await response.json()
    : null;

  if (response.status === 404 || response.status === 501) {
    throw new Error(
      '현재 문의 접수 서버를 준비 중이에요. 입력한 내용은 그대로 유지했어요.',
    );
  }

  throw new Error(
    isApiResponse(responseBody)
      ? responseBody.message
      : '문의를 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  );
}
