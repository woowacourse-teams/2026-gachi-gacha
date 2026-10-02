import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { isApiResponse } from '@/shared/api/isApiResponse';

import type { CreateTradeRequest } from '../tradeCreateType';
import type { TradeDetail } from '../tradeDetailType';
import { createTradeFormData } from './createTrade';
import { getTradeRequestErrorMessage } from './getTradeRequestErrorMessage';
import { parseTradeDetailData } from './parseTradeDetailResponse';

const TRADES_API_PATH = '/api/v1/trades';
const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_ERROR_MESSAGE = '교환 게시글을 수정하지 못했습니다.';
// 백엔드 BaseResponse.updated()의 성공 코드(정상 수정)
const UPDATED_CODE = 'C002';

export interface UpdateTradeOptions {
  tradeId: number;
  request: CreateTradeRequest;
  // 비어 있으면 기존 이미지를 유지하고, 하나라도 있으면 기존 이미지를 전부 교체한다.
  images?: File[];
  signal?: AbortSignal;
}

export async function updateTrade({
  tradeId,
  request,
  images = [],
  signal,
}: UpdateTradeOptions): Promise<TradeDetail> {
  const response = await authenticatedFetch(`${TRADES_API_PATH}/${tradeId}`, {
    method: 'PUT',
    body: createTradeFormData(request, images),
    ...(signal ? { signal } : {}),
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error(
      getTradeRequestErrorMessage(response.status, null, DEFAULT_ERROR_MESSAGE),
    );
  }

  const responseBody: unknown = await response.json();

  if (!response.ok || !isApiResponse(responseBody)) {
    throw new Error(
      getTradeRequestErrorMessage(
        response.status,
        responseBody,
        DEFAULT_ERROR_MESSAGE,
      ),
    );
  }

  if (responseBody.code !== UPDATED_CODE) {
    throw new Error(responseBody.message);
  }

  return parseTradeDetailData(responseBody.data);
}
