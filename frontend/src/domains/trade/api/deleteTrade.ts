import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { isApiResponse } from '@/shared/api/isApiResponse';

import { getTradeRequestErrorMessage } from './getTradeRequestErrorMessage';

const TRADES_API_PATH = '/api/v1/trades';
const JSON_CONTENT_TYPE = 'application/json';
const NO_CONTENT_STATUS = 204;
const DELETED_CODE = 'C003';
const DEFAULT_ERROR_MESSAGE = '교환 게시글을 삭제하지 못했습니다.';

export async function deleteTrade(tradeId: number): Promise<void> {
  const response = await authenticatedFetch(`${TRADES_API_PATH}/${tradeId}`, {
    method: 'DELETE',
  });

  // 삭제 성공 코드(C003)는 204로 정의되어 있어 본문 없이 올 수 있다.
  if (response.status === NO_CONTENT_STATUS) {
    return;
  }

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

  if (responseBody.code !== DELETED_CODE) {
    throw new Error(responseBody.message);
  }
}
