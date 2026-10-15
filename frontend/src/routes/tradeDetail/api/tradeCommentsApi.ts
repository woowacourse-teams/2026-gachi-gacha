import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { isApiResponse } from '@/shared/api/isApiResponse';

import type { TradeCommentSubmission } from '../model/tradeComment';

const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_LOAD_ERROR_MESSAGE = '댓글을 불러오지 못했습니다.';
const DEFAULT_CREATE_ERROR_MESSAGE = '댓글을 등록하지 못했습니다.';

export interface TradeCommentResponse {
  commentId: number;
  memberId: number | null;
  nickname: string;
  profileImageUrl: string | null;
  content: string;
  createdAt: string;
}

interface TradeCommentListResponse {
  comments: TradeCommentResponse[];
  totalCount: number;
}

interface CreateTradeCommentOptions {
  tradeId: number;
  submission: TradeCommentSubmission;
  isAuthenticated: boolean;
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullablePositiveInteger(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isTradeCommentResponse(value: unknown): value is TradeCommentResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
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

function parseComment(value: unknown): TradeCommentResponse {
  if (!isTradeCommentResponse(value)) {
    throw new Error('댓글 응답 형식이 올바르지 않습니다.');
  }

  return value;
}

function parseCommentList(value: unknown): TradeCommentListResponse {
  if (!isRecord(value) || !Array.isArray(value.comments)) {
    throw new Error('댓글 목록 응답 형식이 올바르지 않습니다.');
  }

  const comments = value.comments.map(parseComment);

  if (
    typeof value.totalCount !== 'number' ||
    !Number.isSafeInteger(value.totalCount) ||
    value.totalCount !== comments.length
  ) {
    throw new Error('댓글 목록 응답 형식이 올바르지 않습니다.');
  }

  return { comments, totalCount: value.totalCount };
}

async function readJsonResponse(
  response: Response,
  defaultErrorMessage: string,
): Promise<unknown> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error(defaultErrorMessage);
  }

  const responseBody: unknown = await response.json();

  if (!response.ok || !isApiResponse(responseBody)) {
    throw new Error(
      isApiResponse(responseBody) ? responseBody.message : defaultErrorMessage,
    );
  }

  return responseBody;
}

function validateTradeId(tradeId: number): void {
  if (!Number.isSafeInteger(tradeId) || tradeId <= 0) {
    throw new Error('올바른 교환 게시글 ID가 필요합니다.');
  }
}

export async function getTradeComments(
  tradeId: number,
  signal?: AbortSignal,
): Promise<TradeCommentResponse[]> {
  validateTradeId(tradeId);

  const response = await fetch(`/api/v1/trades/${tradeId}/comments`, {
    ...(signal ? { signal } : {}),
  });
  const responseBody = await readJsonResponse(
    response,
    DEFAULT_LOAD_ERROR_MESSAGE,
  );

  if (!isApiResponse(responseBody) || responseBody.code !== 'C000') {
    throw new Error(
      isApiResponse(responseBody)
        ? responseBody.message
        : DEFAULT_LOAD_ERROR_MESSAGE,
    );
  }

  return parseCommentList(responseBody.data).comments;
}

export async function createTradeComment({
  tradeId,
  submission,
  isAuthenticated,
  signal,
}: CreateTradeCommentOptions): Promise<TradeCommentResponse> {
  validateTradeId(tradeId);

  const request = isAuthenticated ? authenticatedFetch : fetch;
  const response = await request(`/api/v1/trades/${tradeId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': JSON_CONTENT_TYPE },
    body: JSON.stringify(submission),
    ...(signal ? { signal } : {}),
  });
  const responseBody = await readJsonResponse(
    response,
    DEFAULT_CREATE_ERROR_MESSAGE,
  );

  if (!isApiResponse(responseBody) || responseBody.code !== 'C001') {
    throw new Error(
      isApiResponse(responseBody)
        ? responseBody.message
        : DEFAULT_CREATE_ERROR_MESSAGE,
    );
  }

  return parseComment(responseBody.data);
}
