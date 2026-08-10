import { http, HttpResponse } from 'msw';

export type MockStore = {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
};

export const mockStores: MockStore[] = [
  {
    id: 1,
    name: '가치가챠 테스트 매장',
    latitude: 37.5665,
    longitude: 126.978,
  },
];

export const handlers = [
  http.get('/api/stores', () => HttpResponse.json(mockStores)),
];
