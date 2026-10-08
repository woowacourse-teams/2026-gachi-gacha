import { describe, expect, it } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';

import { useSearchStores } from './useSearchStores';
import { nearbyStoresMockResponse } from '../mocks/nearbyStoresMock';

const SEARCH_CENTER = {
  latitude: 37.5563,
  longitude: 126.9236,
  radius: 3000,
};

describe('useSearchStores', () => {
  it('가챠 미선택 상태에서도 홍대 주변 전체 매장을 불러온다', async () => {
    let requestCount = 0;

    server.use(
      http.get('/api/v1/stores/nearby', ({ request }) => {
        requestCount += 1;
        const searchParams = new URL(request.url).searchParams;

        expect(searchParams.get('latitude')).toBe('37.5563');
        expect(searchParams.get('longitude')).toBe('126.9236');
        expect(searchParams.get('radius')).toBe('3000');

        return HttpResponse.json(nearbyStoresMockResponse);
      }),
    );

    const { result } = renderHook(() =>
      useSearchStores({ ...SEARCH_CENTER, gachaId: null }),
    );

    await waitFor(() => {
      expect(result.current.storesState.status).toBe('success');
    });
    expect(requestCount).toBe(1);
    expect(
      result.current.storesState.status === 'success'
        ? result.current.storesState.data.stores
        : [],
    ).toHaveLength(3);
  });
});
