import { useEffect, useState } from 'react';

import { getTradeCategories } from '@/domains/trade/api/getTradeCategories';

export const TRADE_CATEGORY_HOTKEY_NAMES = [
  '산리오',
  '치이카와',
  '포켓몬',
  '짱구',
  '디즈니',
] as const;

export interface TradeFilterCategory {
  categoryId: number | null;
  name: (typeof TRADE_CATEGORY_HOTKEY_NAMES)[number];
}

export type TradeFilterCategoryLoadStatus = 'loading' | 'success' | 'error';

export interface TradeFilterCategoriesState {
  categories: TradeFilterCategory[];
  status: TradeFilterCategoryLoadStatus;
}

const EMPTY_HOTKEYS: TradeFilterCategory[] = TRADE_CATEGORY_HOTKEY_NAMES.map(
  (name) => ({ categoryId: null, name }),
);

function normalizeCategoryName(name: string): string {
  return name.trim().toLocaleLowerCase('ko-KR');
}

export function useTradeFilterCategories(): TradeFilterCategoriesState {
  const [state, setState] = useState<TradeFilterCategoriesState>({
    categories: EMPTY_HOTKEYS,
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const availableCategories = await getTradeCategories(
          '',
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        const categoryIdByName = new Map(
          availableCategories.map(({ categoryId, name }) => [
            normalizeCategoryName(name),
            categoryId,
          ]),
        );

        setState({
          categories: TRADE_CATEGORY_HOTKEY_NAMES.map((name) => ({
            name,
            categoryId:
              categoryIdByName.get(normalizeCategoryName(name)) ?? null,
          })),
          status: 'success',
        });
      } catch {
        if (!controller.signal.aborted) {
          setState({ categories: EMPTY_HOTKEYS, status: 'error' });
        }
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, []);

  return state;
}
