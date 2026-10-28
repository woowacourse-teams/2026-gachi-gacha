import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { isApiResponse } from '@/shared/api/isApiResponse';

import type { CreateTradeRequest } from '../tradeCreateType';
import type { TradeDetail } from '../tradeDetailType';
import { getTradeRequestErrorMessage } from './getTradeRequestErrorMessage';
import { parseTradeDetailData } from './parseTradeDetailResponse';

const TRADES_API_PATH = '/api/v1/trades';
const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_ERROR_MESSAGE = '거래 게시글을 등록하지 못했습니다.';

export interface CreateTradeOptions {
  request: CreateTradeRequest;
  images?: File[];
  signal?: AbortSignal;
}

export function createTradeFormData(
  request: CreateTradeRequest,
  images: File[] = [],
): FormData {
  const formData = new FormData();
  const requestBlob = new Blob([JSON.stringify(request)], {
    type: JSON_CONTENT_TYPE,
  });

  formData.append('request', requestBlob);
  images.forEach((image) => {
    formData.append('images', image);
  });

  return formData;
}

export async function createTrade({
  request,
  images = [],
  signal,
}: CreateTradeOptions): Promise<TradeDetail> {
  const response = await authenticatedFetch(TRADES_API_PATH, {
    method: 'POST',
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

  if (responseBody.code !== 'C001') {
    throw new Error(responseBody.message);
  }

  return parseTradeDetailData(responseBody.data);
}
