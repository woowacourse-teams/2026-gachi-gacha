import type { ChangeEvent } from 'react';

import type { TradeStatus } from '@/domains/trade/tradeSummaryType';

import {
  CategoryButton,
  CategoryFilter,
  CategoryScroller,
  FilterHeading,
  FilterPanel,
  Select,
  SelectFilters,
  SelectLabel,
  SelectLabelText,
} from './TradeFilters.styles';
import {
  TRADE_QUICK_KEYWORDS,
  type TradeQuickKeyword,
  type TradeSortOrder,
} from '../../model/tradeListFilter';

interface TradeFiltersProps {
  selectedQuickKeyword: TradeQuickKeyword | null;
  status: TradeStatus | null;
  sortOrder: TradeSortOrder;
  onSelectQuickKeyword: (keyword: TradeQuickKeyword | null) => void;
  onChangeStatus: (status: TradeStatus | null) => void;
  onChangeSortOrder: (sortOrder: TradeSortOrder) => void;
}

export function TradeFilters({
  selectedQuickKeyword,
  status,
  sortOrder,
  onSelectQuickKeyword,
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
      <CategoryFilter>
        <FilterHeading>카테고리</FilterHeading>
        <CategoryScroller aria-label="카테고리 빠른 검색">
          <CategoryButton
            type="button"
            aria-pressed={selectedQuickKeyword === null}
            onClick={() => onSelectQuickKeyword(null)}
          >
            전체
          </CategoryButton>
          {TRADE_QUICK_KEYWORDS.map((keyword) => (
            <CategoryButton
              key={keyword}
              type="button"
              aria-pressed={selectedQuickKeyword === keyword}
              onClick={() => onSelectQuickKeyword(keyword)}
            >
              {keyword}
            </CategoryButton>
          ))}
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
