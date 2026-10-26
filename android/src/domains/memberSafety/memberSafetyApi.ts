import Constants from 'expo-constants';

import { getMemberReportEndpoint, getMemberSafetyEnvironment } from '../../config/memberSafety';
import { authenticatedFetch } from '../auth/authApi';

const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_REPORT_ERROR_MESSAGE = '신고를 접수하지 못했습니다.';

export interface BlockedMember {
  memberId: number;
  nickname: string;
  blockedAt: string;
}

export const MEMBER_REPORT_REASONS = [
  { value: 'spam', label: '스팸·광고' },
  { value: 'fraud', label: '사기·외부 거래 유도' },
  { value: 'harassment', label: '욕설·괴롭힘' },
  { value: 'inappropriate', label: '음란·부적절한 콘텐츠' },
  { value: 'privacy', label: '개인정보 노출' },
  { value: 'other', label: '기타' },
] as const;

export type MemberReportReason = (typeof MEMBER_REPORT_REASONS)[number]['value'];
export type MemberSafetySource = 'trade' | 'comment' | 'chat' | 'mypage';

export interface MemberReportTarget {
  memberId: number | null;
  nickname: string;
  source: MemberSafetySource;
  referenceId?: string | null;
}

export interface MemberReportSubmission {
  reason: MemberReportReason;
  details: string;
}

interface ApiResponse {
  code: string;
  message?: string;
  data?: unknown;
}

const REPORT_TYPE_LABELS: Record<MemberReportReason, string> = {
  spam: '스팸·광고',
  fraud: '사기·외부 거래 유도',
  harassment: '욕설·괴롭힘',
  inappropriate: '음란·부적절한 콘텐츠',
  privacy: '개인정보 노출',
  other: '기타',
};

const SOURCE_LABELS: Record<MemberSafetySource, string> = {
  trade: '교환글',
  comment: '댓글',
  chat: '채팅',
  mypage: '마이페이지',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiResponse(value: unknown): value is ApiResponse {
  return isRecord(value) && typeof value.code === 'string';
}

function isBlockedMember(value: unknown): value is BlockedMember {
  return (
    isRecord(value) &&
    typeof value.memberId === 'number' &&
    Number.isSafeInteger(value.memberId) &&
    value.memberId > 0 &&
    typeof value.nickname === 'string' &&
    typeof value.blockedAt === 'string'
  );
}

function validateMemberId(memberId: number): void {
  if (!Number.isSafeInteger(memberId) || memberId <= 0) {
    throw new Error('올바른 회원 ID가 필요합니다.');
  }
}

async function readApiResponse(
  response: Response,
  expectedCode: string,
  fallbackMessage: string,
): Promise<unknown> {
  if (!response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)) {
    throw new Error(fallbackMessage);
  }

  const body: unknown = await response.json();

  if (!response.ok || !isApiResponse(body) || body.code !== expectedCode) {
    throw new Error(
      isApiResponse(body) && typeof body.message === 'string'
        ? body.message
        : fallbackMessage,
    );
  }

  return body.data;
}

export async function getBlockedMembers(
  signal?: AbortSignal,
): Promise<BlockedMember[]> {
  const response = await authenticatedFetch('/api/v1/blocks', {
    ...(signal ? { signal } : {}),
  });
  const data = await readApiResponse(
    response,
    'C000',
    '차단한 사용자 목록을 불러오지 못했습니다.',
  );

  if (
    !isRecord(data) ||
    !Array.isArray(data.blocks) ||
    !data.blocks.every(isBlockedMember)
  ) {
    throw new Error('차단한 사용자 목록 응답 형식이 올바르지 않습니다.');
  }

  return data.blocks;
}

export async function requestMemberBlock(memberId: number): Promise<void> {
  validateMemberId(memberId);
  const response = await authenticatedFetch(`/api/v1/blocks/${memberId}`, {
    method: 'PUT',
  });

  await readApiResponse(response, 'C002', '사용자를 차단하지 못했습니다.');
}

export async function requestMemberUnblock(memberId: number): Promise<void> {
  validateMemberId(memberId);
  const response = await authenticatedFetch(`/api/v1/blocks/${memberId}`, {
    method: 'DELETE',
  });

  await readApiResponse(response, 'C003', '차단을 해제하지 못했습니다.');
}

function createReportId(): string {
  return `android-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function submitMemberReport(
  reporterMemberId: number | null,
  target: MemberReportTarget,
  submission: MemberReportSubmission,
): Promise<void> {
  const endpoint = getMemberReportEndpoint();

  if (!endpoint) {
    throw new Error('신고 접수 기능을 준비하고 있어요.');
  }

  if (reporterMemberId === null) {
    throw new Error('로그인 정보를 확인한 뒤 다시 시도해 주세요.');
  }

  const targetNickname = target.nickname.replace(/\s+/g, ' ').trim().slice(0, 80);
  const reference = target.referenceId ? ` #${target.referenceId}` : '';
  const context = `[신고 대상: ${targetNickname} / 위치: ${SOURCE_LABELS[target.source]}${reference}]`;
  const payload = {
    reportId: createReportId(),
    reporterId: String(reporterMemberId),
    reportedUserId:
      target.memberId === null ? 'ANONYMOUS' : String(target.memberId),
    reportType: REPORT_TYPE_LABELS[submission.reason],
    details: submission.details
      ? `${context}\n${submission.details.trim()}`
      : context,
    source: target.source,
    referenceId: target.referenceId ?? null,
    targetNickname,
    submittedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    environment: getMemberSafetyEnvironment(),
  };

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(DEFAULT_REPORT_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(DEFAULT_REPORT_ERROR_MESSAGE);
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return;
  }

  try {
    const responseBody: unknown = JSON.parse(responseText);

    if (
      isRecord(responseBody) &&
      responseBody.ok === false
    ) {
      throw new Error(
        typeof responseBody.message === 'string'
          ? responseBody.message
          : DEFAULT_REPORT_ERROR_MESSAGE,
      );
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return;
    }

    throw error;
  }
}
