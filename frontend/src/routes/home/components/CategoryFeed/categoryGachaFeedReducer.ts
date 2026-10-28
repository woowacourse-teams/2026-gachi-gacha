import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

import type { GachaCardPage } from '../../model/gachaCardPage';
import type { LoadMoreStatus } from '../../model/loadMoreStatus';

export interface CategoryGachaFeedState {
  itemsState: AsyncState<GachaProductSummary[]>;
  nextPage: number | null;
  loadMoreStatus: LoadMoreStatus;
}

type CategoryGachaFeedAction =
  | { type: 'initialLoadStarted' }
  | { type: 'initialLoadSucceeded'; page: GachaCardPage }
  | { type: 'initialLoadFailed'; errorMessage: string }
  | { type: 'nextPageStarted' }
  | { type: 'nextPageSucceeded'; page: GachaCardPage }
  | { type: 'nextPageFailed' };

export const INITIAL_CATEGORY_GACHA_FEED_STATE: CategoryGachaFeedState = {
  itemsState: {
    status: 'loading',
    data: null,
    errorMessage: null,
  },
  nextPage: null,
  loadMoreStatus: 'idle',
};

export function categoryGachaFeedReducer(
  state: CategoryGachaFeedState,
  action: CategoryGachaFeedAction,
): CategoryGachaFeedState {
  switch (action.type) {
    case 'initialLoadStarted':
      return INITIAL_CATEGORY_GACHA_FEED_STATE;

    case 'initialLoadSucceeded':
      return {
        itemsState: {
          status: 'success',
          data: action.page.items,
          errorMessage: null,
        },
        nextPage: action.page.nextPage,
        loadMoreStatus: 'idle',
      };

    case 'initialLoadFailed':
      return {
        ...INITIAL_CATEGORY_GACHA_FEED_STATE,
        itemsState: {
          status: 'error',
          data: null,
          errorMessage: action.errorMessage,
        },
      };

    case 'nextPageStarted':
      return {
        ...state,
        loadMoreStatus: 'loading',
      };

    case 'nextPageSucceeded':
      if (state.itemsState.status !== 'success') return state;

      return {
        itemsState: {
          status: 'success',
          data: [...state.itemsState.data, ...action.page.items],
          errorMessage: null,
        },
        nextPage: action.page.nextPage,
        loadMoreStatus: 'idle',
      };

    case 'nextPageFailed':
      return {
        ...state,
        loadMoreStatus: 'error',
      };
  }
}
