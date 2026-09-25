import { gachaSearchHandlers } from '@/features/gachaSearch/mocks/gachaSearchHandlers';
import { searchHandlers } from '@/routes/search/mocks/searchHandlers';
import { storeDetailHandlers } from '@/routes/stores.$storeId/mocks/storeDetailHandlers';

export const handlers = [
  ...gachaSearchHandlers,
  ...searchHandlers,
  ...storeDetailHandlers,
];
