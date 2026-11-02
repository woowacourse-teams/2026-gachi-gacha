import type { ChangeEvent } from 'react';

import type { TradeStatus } from '@/domains/trade/tradeSummaryType';

import {
  CategoryButton,
  CategoryFilter,
  CategoryMessage,
  CategoryScroller,
  FilterHeading,
  FilterPanel,
  Select,
  SelectFilters,
  SelectLabel,
  SelectLabelText,
} from './TradeFilters.styles';
import type { TradeSortOrder } from '../../model/tradeListFilter';
import type {
  TradeFilterCategory,
  TradeFilterCategoryLoadStatus,
} from '../../useTradeFilterCategories';

interface TradeFiltersProps {
  categories: readonly TradeFilterCategory[];
  categoryStatus: TradeFilterCategoryLoadStatus;
  selectedCategoryId: number | null;
  status: TradeStatus | null;
  sortOrder: TradeSortOrder;
  onSelectCategory: (categoryId: number | null) => void;
  onChangeStatus: (status: TradeStatus | null) => void;
  onChangeSortOrder: (sortOrder: TradeSortOrder) => void;
}

export function TradeFilters({
  categories,
  categoryStatus,
  selectedCategoryId,
  status,
  sortOrder,
  onSelectCategory,
  onChangeStatus,
  onChangeSortOrder,
}: TradeFiltersProps) {
  function changeStatus(event: ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.currentTarget.value;

    onChangeStatus(
      nextStatus === 'AVAILABLE' ||
        nextStatus === 'IN_PROGRESS' ||
        nextStatus === 'COMPLETED'
        ? nextStatus
        : null,
    );
  }

  function changeSortOrder(event: ChangeEvent<HTMLSelectElement>) {
    onChangeSortOrder(
      event.currentTarget.value === 'oldest' ? 'oldest' : 'latest',
    );
  }

  return (
    <FilterPanel aria-label="거래 목록 필터">
      <CategoryFilter aria-busy={categoryStatus === 'loading'}>
        <FilterHeading>카테고리</FilterHeading>
        <CategoryScroller aria-label="대표 카테고리 필터">
          <CategoryButton
            type="button"
            aria-pressed={selectedCategoryId === null}
            onClick={() => onSelectCategory(null)}
          >
            전체
          </CategoryButton>
          {categoryStatus === 'error' ? (
            <CategoryMessage role="alert">
              카테고리를 불러오지 못했어요.
            </CategoryMessage>
          ) : (
            categories.map((category) => (
              <CategoryButton
                key={category.name}
                type="button"
                disabled={category.categoryId === null}
                title={
                  category.categoryId === null && categoryStatus === 'success'
                    ? '현재 사용할 수 없는 카테고리입니다.'
                    : undefined
                }
                aria-pressed={
                  category.categoryId !== null &&
                  selectedCategoryId === category.categoryId
                }
                onClick={() => onSelectCategory(category.categoryId)}
              >
                {category.name}
              </CategoryButton>
            ))
          )}
        </CategoryScroller>
      </CategoryFilter>

      <SelectFilters>
        <SelectLabel>
          <SelectLabelText>교환 상태</SelectLabelText>
          <Select value={status ?? 'ALL'} onChange={changeStatus}>
            <option value="ALL">전체</option>
            <option value="AVAILABLE">교환 가능</option>
            <option value="IN_PROGRESS">진행 중</option>
            <option value="COMPLETED">교환 완료</option>
          </Select>
        </SelectLabel>

        <SelectLabel>
          <SelectLabelText>정렬</SelectLabelText>
          <Select value={sortOrder} onChange={changeSortOrder}>
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </Select>
        </SelectLabel>
      </SelectFilters>
    </FilterPanel>
  );
}
