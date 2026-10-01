import { gachaProductsMock } from '@/domains/product/mocks/gachaProductsMock';
import pokemonDiorama from '@/mocks/assets/pokemon-diorama.jpg';
import pokemonLight from '@/mocks/assets/pokemon-light.jpg';
import sanrioBaby from '@/mocks/assets/sanrio-baby.jpg';
import sanrioCaseTwo from '@/mocks/assets/sanrio-case-two.jpg';
import sanrioCase from '@/mocks/assets/sanrio-case.jpg';
import sanrioClock from '@/mocks/assets/sanrio-clock.jpg';
import sanrioKeychain from '@/mocks/assets/sanrio-keychain.jpg';
import sanrioLight from '@/mocks/assets/sanrio-light.jpg';
import sanrioMini from '@/mocks/assets/sanrio-mini.jpg';
import sanrioNote from '@/mocks/assets/sanrio-note.jpg';
import sanrioPenlight from '@/mocks/assets/sanrio-penlight.jpg';
import sanrioPlush from '@/mocks/assets/sanrio-plush.jpg';
import type { ApiResponse } from '@/shared/api/apiResponseType';

import type { StoreGachaSummary } from '../api/storeGachaType';

interface StoreGachaPageMockData {
  content: readonly StoreGachaSummary[];
  totalElements: number;
  number: number;
  totalPages: number;
}

const storeOneGachaThumbnails = [
  sanrioBaby,
  sanrioCaseTwo,
  sanrioCase,
  sanrioClock,
  sanrioKeychain,
  sanrioLight,
  sanrioMini,
  sanrioNote,
  sanrioPenlight,
  sanrioPlush,
  pokemonDiorama,
  pokemonLight,
] as const;

const storeOneGachas = gachaProductsMock
  .slice(0, storeOneGachaThumbnails.length)
  .map((gacha, index) => ({
    gachaId: gacha.gachaId,
    gachaName: gacha.name,
    thumbnailUrl: storeOneGachaThumbnails[index] ?? null,
  }));

const storeGachasByStoreId = new Map<number, readonly StoreGachaSummary[]>([
  [1, storeOneGachas],
  [2, []],
]);

export function createStoreGachaMockResponse(
  storeId: number,
  page: number,
  size: number,
): ApiResponse<StoreGachaPageMockData> | null {
  const gachas = storeGachasByStoreId.get(storeId);

  if (!gachas) {
    return null;
  }

  const pageStart = page * size;

  return {
    code: 'C000',
    message: '정상',
    data: {
      content: gachas.slice(pageStart, pageStart + size),
      totalElements: gachas.length,
      number: page,
      totalPages: Math.ceil(gachas.length / size),
    },
  };
}
