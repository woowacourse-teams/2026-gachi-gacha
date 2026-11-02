import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import {
  DropdownSelect,
  type DropdownSelectOption,
} from '@/shared/ui/DropdownSelect';

import {
  CategoryButton,
  CategoryFilter,
  CategoryScroller,
  FilterHeading,
  FilterPanel,
  SelectField,
  SelectFilters,
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

type StatusFilter = TradeStatus | 'ALL';

const STATUS_OPTIONS: readonly DropdownSelectOption<StatusFilter>[] = [
  { value: 'ALL', label: '전체' },
  { value: 'AVAILABLE', label: '교환 가능' },
  { value: 'IN_PROGRESS', label: '진행 중' },
  { value: 'COMPLETED', label: '교환 완료' },
];

const SORT_OPTIONS: readonly DropdownSelectOption<TradeSortOrder>[] = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
];

export function TradeFilters({
  selectedQuickKeyword,
  status,
  sortOrder,
  onSelectQuickKeyword,
  onChangeStatus,
  onChangeSortOrder,
}: TradeFiltersProps) {
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
        <SelectField>
          <SelectLabelText>교환 상태</SelectLabelText>
          <DropdownSelect
            ariaLabel="교환 상태"
            value={status ?? 'ALL'}
            options={STATUS_OPTIONS}
            onChange={(nextStatus) =>
              onChangeStatus(nextStatus === 'ALL' ? null : nextStatus)
            }
          />
        </SelectField>

        <SelectField>
          <SelectLabelText>정렬</SelectLabelText>
          <DropdownSelect
            ariaLabel="정렬"
            value={sortOrder}
            options={SORT_OPTIONS}
            align="end"
            onChange={onChangeSortOrder}
          />
        </SelectField>
      </SelectFilters>
    </FilterPanel>
  );
}
