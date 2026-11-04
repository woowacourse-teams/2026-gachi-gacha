import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { captureCoreFeatureFailure } from './coreFeatureErrorMonitoring';
import { captureHandledError } from './errorMonitoringClient';

jest.mock('./errorMonitoringClient', () => ({
  captureHandledError: jest.fn(),
}));

const mockedCaptureHandledError = jest.mocked(captureHandledError);

describe('핵심 기능 오류 수집', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('OAuth 원문 대신 고정된 안전 문맥만 전송한다', () => {
    captureCoreFeatureFailure('oauth_callback');

    expect(mockedCaptureHandledError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'OAuth 콜백 최종 처리가 실패했습니다.',
      }),
      {
        feature: 'auth',
        operation: 'oauth_callback',
      },
    );
  });

  it('검색과 지도 파싱 실패를 서로 다른 저카디널리티 태그로 구분한다', () => {
    captureCoreFeatureFailure('gacha_response_parsing');
    captureCoreFeatureFailure('store_response_parsing');

    expect(mockedCaptureHandledError).toHaveBeenNthCalledWith(
      1,
      expect.any(Error),
      expect.objectContaining({
        feature: 'search',
        operation: 'parse_gacha_response',
      }),
    );
    expect(mockedCaptureHandledError).toHaveBeenNthCalledWith(
      2,
      expect.any(Error),
      expect.objectContaining({
        feature: 'map',
        operation: 'parse_store_response',
      }),
    );
  });
});
