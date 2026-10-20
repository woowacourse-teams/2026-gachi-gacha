import type { MemberSafetySource } from './MemberBlockContext';
import type { MemberReportSubmission } from './ReportDialog';

const DEFAULT_ERROR_MESSAGE = '신고를 접수하지 못했습니다.';

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

export async function submitMemberReport(
  input: MemberReportInput,
  endpoint: string = __MEMBER_REPORT_ENDPOINT__,
): Promise<void> {
  if (!endpoint.trim()) {
    throw new Error('신고 접수 기능을 준비하고 있어요.');
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(input),
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
