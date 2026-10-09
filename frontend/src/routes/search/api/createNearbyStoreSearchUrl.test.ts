import { describe, expect, it } from '@jest/globals';

import { createNearbyStoreSearchUrl } from './createNearbyStoreSearchUrl';

const CENTER = {
  latitude: 37.5563,
  longitude: 126.9236,
  radius: 3000,
};

describe('createNearbyStoreSearchUrl', () => {
  it('가챠를 선택하지 않으면 주변 전체 매장 URL을 만든다', () => {
    expect(createNearbyStoreSearchUrl({ ...CENTER, gachaId: null })).toBe(
      '/api/v1/stores/nearby?latitude=37.5563&longitude=126.9236&radius=3000',
    );
  });

  it('가챠를 선택하면 해당 가챠 보유 매장 URL을 만든다', () => {
    expect(createNearbyStoreSearchUrl({ ...CENTER, gachaId: 42 })).toBe(
      '/api/v1/stores/nearby/42?latitude=37.5563&longitude=126.9236&radius=3000',
    );
  });
});
