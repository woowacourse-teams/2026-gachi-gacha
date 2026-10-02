import { gachaSearchHandlers } from '@/features/gachaSearch/mocks/gachaSearchHandlers';
import { chatHandlers } from '@/routes/chat/mocks/chatHandlers';
import { searchHandlers } from '@/routes/search/mocks/searchHandlers';
import { storeDetailHandlers } from '@/routes/stores.$storeId/mocks/storeDetailHandlers';
import { tradeHandlers } from '@/routes/trade/mocks/tradeHandlers';

import { mockAuthHandlers } from './mockAuth';

export const handlers = [
  ...mockAuthHandlers,
  ...gachaSearchHandlers,
  ...chatHandlers,
  ...searchHandlers,
  ...storeDetailHandlers,
  ...tradeHandlers,
];
