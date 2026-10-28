import { describe, expect, it } from '@jest/globals';

import { normalizeErrorMonitoringRoute } from './normalizeErrorMonitoringRoute';

describe('Sentry 경로 정규화', () => {
  it.each([
    ['/trade/123', '/trade/:tradeId'],
    ['/trade/123/edit', '/trade/:tradeId/edit'],
    ['/trade/new', '/trade/new'],
    ['/stores/42', '/stores/:storeId'],
    ['/chat/7', '/chat/:roomId'],
    ['/chat/start/31', '/chat/start/:tradeId'],
    ['/oauth/login/apple', '/oauth/login/:provider'],
  ])('%s를 %s 템플릿으로 변환한다', (pathname, expected) => {
    expect(normalizeErrorMonitoringRoute(pathname)).toBe(expected);
  });

  it('알 수 없는 숫자와 UUID 세그먼트도 원문을 남기지 않는다', () => {
    expect(normalizeErrorMonitoringRoute('/future/921/items')).toBe(
      '/future/:id/items',
    );
    expect(
      normalizeErrorMonitoringRoute(
        '/future/550e8400-e29b-41d4-a716-446655440000',
      ),
    ).toBe('/future/:id');
  });

  it('정적 경로는 그대로 유지한다', () => {
    expect(normalizeErrorMonitoringRoute('/mypage/trades')).toBe(
      '/mypage/trades',
    );
  });
});
