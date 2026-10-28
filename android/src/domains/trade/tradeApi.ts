import { File, Paths } from 'expo-file-system';

import { getApiBaseUrl } from '../../config/api';
import { authenticatedFetch } from '../auth/authApi';
import {
  TRADE_STATUSES,
  type TradeCategory,
  type TradeStatus,
  type TradeDetail,
  type TradeImageUpload,
  type TradePlace,
  type TradeSummary,
  type TradeSummaryPage,
  type TradeWriteRequest,
} from './tradeTypes';

const DEFAULT_ERROR_MESSAGE = '교환 게시글을 불러오지 못했습니다.';
const JSON_CONTENT_TYPE = 'application/json';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isTradeStatus(value: unknown): value is TradeStatus {
  return typeof value === 'string' && TRADE_STATUSES.some((status) => status === value);
}

function parseTradeCategory(value: unknown): TradeCategory {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.categoryId) ||
    Number(value.categoryId) <= 0 ||
    typeof value.name !== 'string'
  ) {
    throw new Error('카테고리 응답 형식이 올바르지 않습니다.');
  }

  return { categoryId: Number(value.categoryId), name: value.name };
}

function isTradeSummary(value: unknown): value is TradeSummary {
  if (!isRecord(value)) return false;
  const place = value.tradePlace;

  return (
    isInteger(value.tradeId) &&
    isInteger(value.memberId) &&
    typeof value.title === 'string' &&
    isTradeStatus(value.status) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === 'string') &&
    isNullableString(value.thumbnailUrl) &&
    (place === null ||
      (isRecord(place) &&
        isNullableString(place.name) &&
        typeof place.address === 'string')) &&
    typeof value.createdAt === 'string'
  );
}

function isTradePlace(value: unknown): value is TradePlace {
  return isRecord(value) && isNullableString(value.name) &&
    typeof value.address === 'string' && typeof value.latitude === 'number' &&
    typeof value.longitude === 'number';
}

function isTradeDetail(value: unknown): value is TradeDetail {
  return isRecord(value) && isInteger(value.tradeId) && value.tradeId > 0 &&
    isInteger(value.memberId) && value.memberId > 0 && typeof value.title === 'string' &&
    isNullableString(value.description) && isNullableString(value.desiredProduction) &&
    Array.isArray(value.categories) && value.categories.every((item) => typeof item === 'string') &&
    isTradeStatus(value.status) && (value.purchaseStore === null || isTradePlace(value.purchaseStore)) &&
    (value.tradePlace === null || isTradePlace(value.tradePlace)) &&
    isNullableString(value.availableTime) && Array.isArray(value.imageUrls) &&
    value.imageUrls.every((item) => typeof item === 'string') &&
    typeof value.createdAt === 'string' && typeof value.updatedAt === 'string';
}

function parseResponse(value: unknown): TradeSummaryPage {
  if (!isRecord(value) || typeof value.code !== 'string') {
    throw new Error('서버 응답 형식이 올바르지 않습니다.');
  }
  if (value.code !== 'C000') {
    throw new Error(typeof value.message === 'string' ? value.message : DEFAULT_ERROR_MESSAGE);
  }

  const data = value.data;
  if (!isRecord(data) || !Array.isArray(data.content) || !data.content.every(isTradeSummary)) {
    throw new Error('교환 게시글 응답 형식이 올바르지 않습니다.');
  }
  if (![data.number, data.size, data.totalElements, data.totalPages].every(isInteger)) {
    throw new Error('교환 게시글 페이지 정보가 올바르지 않습니다.');
  }

  return {
    content: data.content,
    pageNumber: data.number as number,
    pageSize: data.size as number,
    totalElements: data.totalElements as number,
    totalPages: data.totalPages as number,
  };
}

export async function getTrades({
  keyword = '',
  page = 0,
  signal,
  size = 20,
  status,
}: {
  keyword?: string;
  page?: number;
  signal?: AbortSignal;
  size?: number;
  status?: TradeStatus;
} = {}): Promise<TradeSummaryPage> {
  const apiBaseUrl = getApiBaseUrl();
  const pageSize = Number.isSafeInteger(size) && size > 0 ? size : 20;

  const params = new URLSearchParams({
    page: String(page),
    size: String(pageSize),
    sort: 'createdAt,desc',
  });
  if (keyword.trim()) params.set('keyword', keyword.trim());
  if (status) params.set('status', status);

  const response = await fetch(`${apiBaseUrl}/api/v1/trades?${params}`, { signal });
  const body: unknown = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(isRecord(body) && typeof body.message === 'string' ? body.message : DEFAULT_ERROR_MESSAGE);
  }
  if (body === null) throw new Error(DEFAULT_ERROR_MESSAGE);
  return parseResponse(body);
}

export async function getTradeDetail(tradeId: number, signal?: AbortSignal): Promise<TradeDetail> {
  if (!Number.isSafeInteger(tradeId) || tradeId <= 0) throw new Error('올바른 교환 게시글 ID가 필요합니다.');
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/api/v1/trades/${tradeId}`, { signal });
  const body: unknown = response.headers.get('content-type')?.includes('application/json')
    ? await response.json() : null;
  if (!response.ok) {
    throw new Error(isRecord(body) && typeof body.message === 'string' ? body.message : DEFAULT_ERROR_MESSAGE);
  }
  if (!isRecord(body) || body.code !== 'C000' || !isTradeDetail(body.data)) {
    throw new Error('교환 게시글 응답 형식이 올바르지 않습니다.');
  }
  return body.data;
}

export async function getMyTrades({
  page = 0,
  signal,
  size = 20,
  status,
}: {
  page?: number;
  signal?: AbortSignal;
  size?: number;
  status?: TradeStatus;
} = {}): Promise<TradeSummaryPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set('status', status);

  const response = await authenticatedFetch(`/api/v1/trades/me?${params}`, { signal });
  const body: unknown = response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(
      isRecord(body) && typeof body.message === 'string'
        ? body.message
        : '내 교환글을 불러오지 못했습니다.',
    );
  }
  if (body === null) throw new Error('내 교환글을 불러오지 못했습니다.');
  return parseResponse(body);
}

export async function getTradeCategories(
  keyword = '',
  signal?: AbortSignal,
): Promise<TradeCategory[]> {
  const normalizedKeyword = keyword.trim();
  const query = normalizedKeyword
    ? `?${new URLSearchParams({ keyword: normalizedKeyword })}`
    : '';
  const response = await fetch(`${getApiBaseUrl()}/api/v1/categories${query}`, { signal });
  const body: unknown = response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)
    ? await response.json()
    : null;

  if (!response.ok || !isRecord(body) || body.code !== 'C000') {
    throw new Error(
      isRecord(body) && typeof body.message === 'string'
        ? body.message
        : '카테고리를 불러오지 못했습니다.',
    );
  }
  if (!isRecord(body.data) || !Array.isArray(body.data.items)) {
    throw new Error('카테고리 응답 형식이 올바르지 않습니다.');
  }

  return body.data.items.map(parseTradeCategory);
}

function getTradeMutationError(
  status: number,
  body: unknown,
  fallbackMessage: string,
): string {
  if (status === 413) {
    return '사진 용량이 너무 커서 업로드하지 못했어요. 사진 수나 크기를 줄여 다시 시도해 주세요.';
  }
  if (!isRecord(body)) return fallbackMessage;

  const labels: Record<string, string> = {
    title: '제목',
    description: '설명',
    desiredProduction: '얻고 싶은 상품',
    categoryIds: '카테고리',
    purchaseStore: '구매 매장',
    tradePlace: '거래 장소',
    availableTime: '거래 가능 일시',
  };
  const fieldErrors = Array.isArray(body.errors)
    ? body.errors.flatMap((error) => {
      if (!isRecord(error) || typeof error.field !== 'string' || typeof error.reason !== 'string') {
        return [];
      }
      const field = error.field.split('.')[0] ?? error.field;
      return [`${labels[field] ? `${labels[field]}: ` : ''}${error.reason}`];
    })
    : [];

  if (fieldErrors.length > 0) return fieldErrors.join('\n');
  return typeof body.message === 'string' ? body.message : fallbackMessage;
}

function createTradeFormData(
  request: TradeWriteRequest,
  images: readonly TradeImageUpload[],
): { formData: FormData; requestFile: File } {
  const formData = new FormData();
  const requestFile = new File(
    Paths.cache,
    `trade-request-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  requestFile.create({ overwrite: true });
  requestFile.write(JSON.stringify(request));
  formData.append('request', {
    uri: requestFile.uri,
    name: 'request.json',
    type: JSON_CONTENT_TYPE,
  } as unknown as Blob);
  images.forEach((image) => {
    formData.append('images', {
      uri: image.uri,
      name: image.fileName,
      type: image.mimeType,
    } as unknown as Blob);
  });
  return { formData, requestFile };
}

async function readTradeMutation(
  response: Response,
  expectedCode: 'C001' | 'C002',
  fallbackMessage: string,
): Promise<TradeDetail> {
  const body: unknown = response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)
    ? await response.json()
    : null;

  if (!response.ok || !isRecord(body) || body.code !== expectedCode) {
    throw new Error(getTradeMutationError(response.status, body, fallbackMessage));
  }
  if (!isTradeDetail(body.data)) {
    throw new Error('저장된 교환 게시글 응답 형식이 올바르지 않습니다.');
  }
  return body.data;
}

export async function createTrade(
  request: TradeWriteRequest,
  images: readonly TradeImageUpload[],
): Promise<TradeDetail> {
  const { formData, requestFile } = createTradeFormData(request, images);
  try {
    const response = await authenticatedFetch('/api/v1/trades', {
      method: 'POST',
      body: formData,
    });
    return await readTradeMutation(response, 'C001', '교환 게시글을 등록하지 못했습니다.');
  } finally {
    if (requestFile.exists) requestFile.delete();
  }
}

export async function updateTrade(
  tradeId: number,
  request: TradeWriteRequest,
  images: readonly TradeImageUpload[],
): Promise<TradeDetail> {
  const { formData, requestFile } = createTradeFormData(request, images);
  try {
    const response = await authenticatedFetch(`/api/v1/trades/${tradeId}`, {
      method: 'PUT',
      body: formData,
    });
    return await readTradeMutation(response, 'C002', '교환 게시글을 수정하지 못했습니다.');
  } finally {
    if (requestFile.exists) requestFile.delete();
  }
}

export async function updateTradeStatus(
  tradeId: number,
  status: TradeStatus,
): Promise<TradeDetail> {
  const response = await authenticatedFetch(`/api/v1/trades/${tradeId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': JSON_CONTENT_TYPE },
    body: JSON.stringify({ status }),
  });
  return readTradeMutation(response, 'C002', '교환 상태를 변경하지 못했습니다.');
}

export async function deleteTrade(tradeId: number): Promise<void> {
  const response = await authenticatedFetch(`/api/v1/trades/${tradeId}`, {
    method: 'DELETE',
  });
  if (response.status === 204) return;

  const body: unknown = response.headers.get('content-type')?.includes(JSON_CONTENT_TYPE)
    ? await response.json()
    : null;
  if (!response.ok || !isRecord(body) || body.code !== 'C003') {
    throw new Error(getTradeMutationError(response.status, body, '교환 게시글을 삭제하지 못했습니다.'));
  }
}
