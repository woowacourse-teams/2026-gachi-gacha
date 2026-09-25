import pokemonDiorama from '@/demo/assets/pokemon-diorama.jpg';
import pokemonLight from '@/demo/assets/pokemon-light.jpg';
import sanrioBaby from '@/demo/assets/sanrio-baby.jpg';
import sanrioCaseTwo from '@/demo/assets/sanrio-case-two.jpg';
import sanrioCase from '@/demo/assets/sanrio-case.jpg';
import sanrioClock from '@/demo/assets/sanrio-clock.jpg';
import sanrioKeychain from '@/demo/assets/sanrio-keychain.jpg';
import sanrioLight from '@/demo/assets/sanrio-light.jpg';
import sanrioMini from '@/demo/assets/sanrio-mini.jpg';
import sanrioNote from '@/demo/assets/sanrio-note.jpg';
import sanrioPenlight from '@/demo/assets/sanrio-penlight.jpg';
import sanrioPlush from '@/demo/assets/sanrio-plush.jpg';
import type { ApiResponse } from '@/shared/api/apiResponseType';

import type { StoreGachaSummary } from '../api/storeGachaType';

interface StoreGachaPageMockData {
  content: readonly StoreGachaSummary[];
  totalElements: number;
  number: number;
  totalPages: number;
}

const storeGachasByStoreId = new Map<number, readonly StoreGachaSummary[]>([
  [
    1,
    [
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
    ].map((thumbnailUrl, index) => ({
      gachaId: index + 10,
      thumbnailUrl,
    })),
  ],
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
