import { captureHandledError } from './errorMonitoringClient';

type CoreFeatureFailure =
  | 'oauth_callback'
  | 'gacha_response_parsing'
  | 'store_response_parsing'
  | 'chat_reconnect_exhausted'
  | 'trade_create_server'
  | 'trade_image_compression'
  | 'chat_image_compression'
  | 'chat_image_upload';

const FAILURE_CONTEXTS: Record<
  CoreFeatureFailure,
  {
    message: string;
    feature: string;
    operation: string;
    level?: 'error' | 'warning';
  }
> = {
  oauth_callback: {
    message: 'OAuth 콜백 최종 처리가 실패했습니다.',
    feature: 'auth',
    operation: 'oauth_callback',
  },
  gacha_response_parsing: {
    message: '가챠 검색 응답을 해석하지 못했습니다.',
    feature: 'search',
    operation: 'parse_gacha_response',
  },
  store_response_parsing: {
    message: '주변 매장 응답을 해석하지 못했습니다.',
    feature: 'map',
    operation: 'parse_store_response',
  },
  chat_reconnect_exhausted: {
    message: '채팅 연결이 연속으로 실패했습니다.',
    feature: 'chat',
    operation: 'socket_reconnect',
  },
  trade_create_server: {
    message: '교환글 작성 요청이 서버 오류로 실패했습니다.',
    feature: 'trade',
    operation: 'create_trade',
  },
  trade_image_compression: {
    message: '교환글 이미지 최적화가 모든 형식에서 실패했습니다.',
    feature: 'trade',
    operation: 'compress_image',
  },
  chat_image_compression: {
    message: '채팅 이미지 최적화가 모든 형식에서 실패했습니다.',
    feature: 'chat',
    operation: 'compress_image',
  },
  chat_image_upload: {
    message: '채팅 이미지 업로드 또는 응답 처리가 실패했습니다.',
    feature: 'chat',
    operation: 'upload_image',
  },
};

/**
 * 원본 오류 메시지에 파일명·응답 본문·OAuth 값이 섞일 수 있으므로
 * 제품 오류는 허용된 고정 문맥만 Sentry로 전송한다.
 */
export function captureCoreFeatureFailure(failure: CoreFeatureFailure): void {
  const { message, ...context } = FAILURE_CONTEXTS[failure];

  captureHandledError(new Error(message), context);
}
