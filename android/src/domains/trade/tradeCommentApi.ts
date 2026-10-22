import { getApiBaseUrl } from '../../config/api';

const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_LOAD_ERROR_MESSAGE = '댓글을 불러오지 못했습니다.';
const DEFAULT_CREATE_ERROR_MESSAGE = '댓글을 등록하지 못했습니다.';

export interface TradeComment {
  commentId: number;
  memberId: number | null;
  nickname: string;
  profileImageUrl: string | null;
  content: string;
  createdAt: string;
}

export interface TradeCommentSubmission {
  nickname: string | null;
  content: string;
}

interface ApiResponse {
  code: string;
  message?: string;
  data: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiResponse(value: unknown): value is ApiResponse {
  return isRecord(value) && typeof value.code === 'string' && 'data' in value;
}

function isNullablePositiveInteger(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value > 0);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isTradeComment(value: unknown): value is TradeComment {
  return (
    isRecord(value) &&
    typeof value.commentId === 'number' &&
    Number.isSafeInteger(value.commentId) &&
    value.commentId > 0 &&
    isNullablePositiveInteger(value.memberId) &&
    typeof value.nickname === 'string' &&
    isNullableString(value.profileImageUrl) &&
    typeof value.content === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function validateTradeId(tradeId: number): void {
  if (!Number.isSafeInteger(tradeId) || tradeId <= 0) {
    throw new Error('올바른 교환 게시글 ID가 필요합니다.');
  }
}

async function readResponse(response: Response, fallbackMessage: string): Promise<ApiResponse> {
  const contentType = response.headers.get('content-type');
  const body: unknown = contentType?.includes(JSON_CONTENT_TYPE) ? await response.json() : null;

  if (!response.ok || !isApiResponse(body)) {
    throw new Error(isApiResponse(body) && typeof body.message === 'string' ? body.message : fallbackMessage);
  }

  return body;
}

function byRegistration(left: TradeComment, right: TradeComment): number {
  return left.commentId - right.commentId;
}

export async function getTradeComments(tradeId: number, signal?: AbortSignal): Promise<TradeComment[]> {
  validateTradeId(tradeId);
  const response = await fetch(`${getApiBaseUrl()}/api/v1/trades/${tradeId}/comments`, { signal });
  const body = await readResponse(response, DEFAULT_LOAD_ERROR_MESSAGE);

  if (body.code !== 'C000' || !isRecord(body.data) || !Array.isArray(body.data.comments)) {
    throw new Error(typeof body.message === 'string' ? body.message : DEFAULT_LOAD_ERROR_MESSAGE);
  }

  const comments = body.data.comments;
  if (!comments.every(isTradeComment)) {
    throw new Error('댓글 응답 형식이 올바르지 않습니다.');
  }

  return [...comments].sort(byRegistration);
}

export async function createTradeComment(
  tradeId: number,
  submission: TradeCommentSubmission,
): Promise<TradeComment> {
  validateTradeId(tradeId);
  const response = await fetch(`${getApiBaseUrl()}/api/v1/trades/${tradeId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': JSON_CONTENT_TYPE },
    body: JSON.stringify(submission),
  });
  const body = await readResponse(response, DEFAULT_CREATE_ERROR_MESSAGE);

  if (body.code !== 'C001' || !isTradeComment(body.data)) {
    throw new Error(typeof body.message === 'string' ? body.message : DEFAULT_CREATE_ERROR_MESSAGE);
  }

  return body.data;
}

export function orderTradeComments(comments: TradeComment[]): TradeComment[] {
  return [...comments].sort(byRegistration);
}
