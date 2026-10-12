import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { isApiResponse } from '@/shared/api/isApiResponse';

import type { TradeDetail } from '../tradeDetailType';
import type { TradeStatus } from '../tradeSummaryType';
import { getTradeRequestErrorMessage } from './getTradeRequestErrorMessage';
import { parseTradeDetailData } from './parseTradeDetailResponse';

const TRADES_API_PATH = '/api/v1/trades';
const JSON_CONTENT_TYPE = 'application/json';
const UPDATED_CODE = 'C002';
const DEFAULT_ERROR_MESSAGE = '교환 상태를 변경하지 못했습니다.';

export interface UpdateTradeStatusOptions {
  tradeId: number;
  status: TradeStatus;
}

export async function updateTradeStatus({
  tradeId,
  status,
}: UpdateTradeStatusOptions): Promise<TradeDetail> {
  const response = await authenticatedFetch(
    `${TRADES_API_PATH}/${tradeId}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': JSON_CONTENT_TYPE },
      body: JSON.stringify({ status }),
    },
  );
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
