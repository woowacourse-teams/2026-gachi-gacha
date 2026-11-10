import {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled from '@emotion/styled';

import type { TradeCategory } from '@/domains/trade/tradeCategoryType';
import { preventIosInputZoom } from '@/shared/styles/preventIosInputZoom';

import { useTradeCategories } from '../../useTradeCategories';

interface TradeCategoryFieldProps {
  selectedCategories: TradeCategory[];
  onSelect: (category: TradeCategory) => void;
  onRemove: (categoryId: number) => void;
  invalid?: boolean;
}

type PendingFocus = { categoryId: number } | 'input' | null;
interface SearchResultSummary {
  keyword: string;
  count: number;
}

export default function TradeCategoryField({
  selectedCategories,
  onSelect,
  onRemove,
  invalid,
}: TradeCategoryFieldProps) {
  const [keyword, setKeyword] = useState('');
  const [resultSummary, setResultSummary] = useState<SearchResultSummary>({
    keyword: '',
    count: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const pendingFocusRef = useRef<PendingFocus>(null);
  const pendingSelectionRef = useRef<number | null>(null);
  const normalizedKeyword = keyword.trim();
  const hideIdleCopy = selectedCategories.length > 0 && !normalizedKeyword;
  const hasSearchResults =
    normalizedKeyword !== '' &&
    resultSummary.keyword === normalizedKeyword &&
    resultSummary.count > 0;

  useLayoutEffect(() => {
    const pendingSelection = pendingSelectionRef.current;

    if (
      pendingSelection !== null &&
      selectedCategories.some(
        ({ categoryId }) => categoryId === pendingSelection,
      )
    ) {
      pendingSelectionRef.current = null;
    }

    const pendingFocus = pendingFocusRef.current;
    const target =
      pendingFocus === 'input'
        ? inputRef.current
        : pendingFocus
          ? selectedRef.current?.querySelector<HTMLButtonElement>(
              `[data-category-id="${pendingFocus.categoryId}"]`,
            )
          : null;

    if (target) {
      pendingFocusRef.current = null;
      // 선택 버튼은 검색 결과와 함께 사라진다. 새 칩으로 이어가되
      // 입력으로 강제 복귀해 모바일 키보드를 다시 열지는 않는다.
      target.focus();
    }
  }, [selectedCategories]);

  function selectCategory(category: TradeCategory) {
    if (
      pendingSelectionRef.current !== null ||
      selectedCategories.some(
        ({ categoryId }) => categoryId === category.categoryId,
      )
    ) {
      return;
    }

    pendingSelectionRef.current = category.categoryId;
    pendingFocusRef.current = { categoryId: category.categoryId };
    setKeyword('');
    onSelect(category);
  }

  function removeCategory(categoryId: number) {
    const index = selectedCategories.findIndex(
      (category) => category.categoryId === categoryId,
    );
    const nextCategory =
      selectedCategories[index + 1] ?? selectedCategories[index - 1];

    pendingFocusRef.current = nextCategory
      ? { categoryId: nextCategory.categoryId }
      : 'input';
    onRemove(categoryId);
  }

  function focusFirstSearchResult() {
    resultsRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }

  function moveToSearchResults(event: KeyboardEvent<HTMLInputElement>) {
    if (
      event.key !== 'Enter' ||
      event.nativeEvent.isComposing ||
      event.nativeEvent.keyCode === 229
    ) {
      return;
    }

    event.preventDefault();
    // Enter는 검색 결과를 확인하는 동작이지 첫 결과에 동의하는 동작이 아니다.
    focusFirstSearchResult();
  }

  return (
    <Field>
      <Label htmlFor="trade-category-search">
        카테고리 <RequiredMark aria-hidden="true">*</RequiredMark>
      </Label>
      <Input
        ref={inputRef}
        id="trade-category-search"
        aria-required="true"
        aria-invalid={invalid || undefined}
        aria-describedby="trade-category-help"
        type="search"
        enterKeyHint="search"
        value={keyword}
        autoComplete="off"
        placeholder="카테고리를 검색해주세요"
        onChange={(event) => setKeyword(event.target.value)}
        onKeyDown={moveToSearchResults}
      />
      {hasSearchResults && (
        <SearchResultsShortcut
          type="button"
          aria-controls="trade-category-results"
          onClick={focusFirstSearchResult}
        >
          카테고리 검색 결과로 이동
        </SearchResultsShortcut>
      )}
      <span id="trade-category-help" hidden>
        검색 결과에서 추가할 카테고리를 선택하세요. 검색 결과로 이동 버튼이나
        키보드의 검색 버튼을 누르면 첫 검색 결과로 이동합니다.
      </span>

      {selectedCategories.length > 0 && (
        <CategoryGroup
          ref={selectedRef}
          role="group"
          aria-label="선택한 카테고리"
        >
          <CategoryGroupLabel aria-hidden="true">
            선택한 카테고리
          </CategoryGroupLabel>
          {selectedCategories.map((category) => (
            <input
              key={category.categoryId}
              type="hidden"
              name="categoryIds"
              value={category.categoryId}
            />
          ))}
          <CategoryList>
            {selectedCategories.map((category) => (
              <CategoryButton
                key={category.categoryId}
                type="button"
                data-selected="true"
                data-category-id={category.categoryId}
                aria-label={`${category.name} 카테고리 선택 해제`}
                onClick={() => removeCategory(category.categoryId)}
              >
                #{category.name} ×
              </CategoryButton>
            ))}
          </CategoryList>
        </CategoryGroup>
      )}

      <CategoryGroup
        ref={resultsRef}
        id="trade-category-results"
        role="group"
        aria-label="카테고리 검색 결과"
        aria-hidden={hideIdleCopy || undefined}
      >
        <CategoryGroupLabel aria-hidden="true">검색 결과</CategoryGroupLabel>
        {/* 검색어가 바뀌면 이전 응답과 버튼을 즉시 버린다. */}
        <CategorySearchResults
          key={normalizedKeyword}
          keyword={normalizedKeyword}
          selectedCategories={selectedCategories}
          onSelect={selectCategory}
          onResultsChange={setResultSummary}
        />
      </CategoryGroup>
    </Field>
  );
}

function CategorySearchResults({
  keyword,
  selectedCategories,
  onSelect,
  onResultsChange,
}: Omit<TradeCategoryFieldProps, 'onRemove' | 'invalid'> & {
  keyword: string;
  onResultsChange: (summary: SearchResultSummary) => void;
}) {
  const state = useTradeCategories(keyword);
  const availableCategories =
    state.status === 'success'
      ? state.data.filter(
          (category) =>
            !selectedCategories.some(
              (selected) => selected.categoryId === category.categoryId,
            ),
        )
      : [];

  useEffect(() => {
    onResultsChange({ keyword, count: availableCategories.length });
  }, [keyword, availableCategories.length, onResultsChange]);

  if (!keyword) {
    return <CategoryMessage>카테고리를 검색해주세요.</CategoryMessage>;
  }

  return (
    <>
      <ScreenReaderStatus role="status" aria-atomic="true">
        {state.status === 'success'
          ? `${keyword} 검색 결과 ${availableCategories.length}개.`
          : ''}
      </ScreenReaderStatus>
      {state.status === 'idle' || state.status === 'loading' ? (
        <CategoryMessage>카테고리를 불러오는 중...</CategoryMessage>
      ) : state.status === 'error' ? (
        <CategoryMessage role="alert">{state.errorMessage}</CategoryMessage>
      ) : availableCategories.length === 0 ? (
        <CategoryMessage>검색결과가 없어요.</CategoryMessage>
      ) : (
        <CategoryList>
          {availableCategories.map((category) => (
            <CategoryButton
              key={category.categoryId}
              type="button"
              data-selected="false"
              aria-label={`${category.name} 카테고리에 추가`}
              onClick={() => onSelect(category)}
            >
              {category.name}
            </CategoryButton>
          ))}
        </CategoryList>
      )}
    </>
  );
}

const Field = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  color: #242429;
  font-size: 15px;
  font-weight: 800;
`;

const RequiredMark = styled.span`
  color: #ed174c;
`;

const SearchResultsShortcut = styled.button`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;

  &:focus-visible {
    position: static;
    width: auto;
    height: auto;
    padding: 8px;
    border: 2px solid #242429;
    border-radius: 8px;
    overflow: visible;
    clip-path: none;
    white-space: normal;
    background: #ffffff;
    color: #242429;
  }
`;

const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  outline: none;
  background: #f7f7f8;
  color: #242429;
  font-size: 15px;

  &::placeholder {
    color: #92949c;
  }

  &:focus {
    border-color: #ed174c;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgb(237 23 76 / 10%);
  }

  &[aria-invalid='true'] {
    border-color: #d80f42;
    background: #ffffff;
  }

  ${preventIosInputZoom}
`;

const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CategoryGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CategoryGroupLabel = styled.p`
  margin: 0;
  color: #777981;
  font-size: 13px;
  font-weight: 700;
`;

const CategoryMessage = styled.p`
  margin: 0;
  color: #858790;
  font-size: 14px;
`;

const CategoryButton = styled.button`
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #f5f5f6;
  color: #6e7078;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &[data-selected='true'] {
    background: #ed174c;
    color: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid #242429;
    outline-offset: 3px;
  }
`;

const ScreenReaderStatus = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;
