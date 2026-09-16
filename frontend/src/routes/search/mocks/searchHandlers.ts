import { http, HttpResponse } from 'msw';

import { nearbyStoresMockResponse } from './nearbyStoresMock';

export const searchHandlers = [
  http.get('/api/v1/stores/nearby', () => {
    return HttpResponse.json(nearbyStoresMockResponse);
  }),
];
