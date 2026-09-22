import { gachaSearchHandlers } from '@/features/gachaSearch/mocks/gachaSearchHandlers';
import { searchHandlers } from '@/routes/search/mocks/searchHandlers';

export const handlers = [...gachaSearchHandlers, ...searchHandlers];
