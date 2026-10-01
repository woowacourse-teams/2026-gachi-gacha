import { gachaSearchHandlers } from '@/features/gachaSearch/mocks/gachaSearchHandlers';
import { homeHandlers } from '@/routes/home/mocks/homeHandlers';
import { searchHandlers } from '@/routes/search/mocks/searchHandlers';
import { storeDetailHandlers } from '@/routes/stores.$storeId/mocks/storeDetailHandlers';
import { tradeHandlers } from '@/routes/trade/mocks/tradeHandlers';

export const handlers = [
  ...gachaSearchHandlers,
  ...homeHandlers,
  ...searchHandlers,
  ...storeDetailHandlers,
  ...tradeHandlers,
];
