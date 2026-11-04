import type { MemberSafetySource } from './MemberBlockContext';
import type { MemberReportSubmission } from './ReportDialog';

const DEFAULT_ERROR_MESSAGE = '신고를 접수하지 못했습니다.';
const REPORT_TYPE_LABELS = {
  spam: '스팸·광고',
  fraud: '사기·외부 거래 유도',
  harassment: '욕설·괴롭힘',
  inappropriate: '음란·부적절한 콘텐츠',
  privacy: '개인정보 노출',
  other: '기타',
} as const;
const SOURCE_LABELS = {
  trade: '교환글',
  comment: '댓글',
  chat: '채팅',
  mypage: '마이페이지',
} as const;

export interface MemberReportInput extends MemberReportSubmission {
  reportId: string;
  reporterMemberId: string | null;
  targetMemberId: number | null;
  targetNickname: string;
  source: MemberSafetySource;
  referenceId: string | null;
  pagePath: string;
  submittedAt: string;
  appVersion: string;
  environment: string;
}

interface TemporaryMemberReportPayload extends MemberReportInput {
  reporterId: string;
  reportedUserId: string;
  reportType: (typeof REPORT_TYPE_LABELS)[MemberReportInput['reason']];
}

function createTemporaryPayload(
  input: MemberReportInput,
): TemporaryMemberReportPayload {
  if (!input.reporterMemberId) {
    throw new Error('로그인 정보를 확인한 뒤 다시 시도해 주세요.');
  }

  const targetNickname = input.targetNickname
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  const reference = input.referenceId ? ` #${input.referenceId}` : '';
  const context = `[신고 대상: ${targetNickname} / 위치: ${SOURCE_LABELS[input.source]}${reference}]`;

  return {
    ...input,
    reporterId: input.reporterMemberId,
    reportedUserId:
      input.targetMemberId === null
        ? 'ANONYMOUS'
        : String(input.targetMemberId),
    reportType: REPORT_TYPE_LABELS[input.reason],
    details: input.details ? `${context}\n${input.details}` : context,
  };
}

export async function submitMemberReport(
  input: MemberReportInput,
  endpoint: string = __MEMBER_REPORT_ENDPOINT__,
): Promise<void> {
  if (!endpoint.trim()) {
    throw new Error('신고 접수 기능을 준비하고 있어요.');
  }

  const payload = createTemporaryPayload(input);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(payload),
      credentials: 'omit',
    });
  } catch {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return;
  }

  try {
    const responseBody: unknown = JSON.parse(responseText);

    if (
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'ok' in responseBody &&
      responseBody.ok === false
    ) {
      const message =
        'message' in responseBody && typeof responseBody.message === 'string'
          ? responseBody.message
          : DEFAULT_ERROR_MESSAGE;

      throw new Error(message);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return;
    }

    throw error;
  }
}
