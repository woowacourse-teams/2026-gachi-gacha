import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TradeFilters } from './TradeFilters';

const categories = [
  { categoryId: 1, name: '산리오' as const },
  { categoryId: 2, name: '치이카와' as const },
  { categoryId: 3, name: '포켓몬' as const },
  { categoryId: 4, name: '짱구' as const },
  { categoryId: 5, name: '디즈니' as const },
];

describe('거래 목록 필터', () => {
  it('카테고리·교환 상태·정렬 변경을 각각 전달한다', async () => {
    const user = userEvent.setup();
    const onSelectCategory = jest.fn();
    const onChangeStatus = jest.fn();
    const onChangeSortOrder = jest.fn();

    render(
      <TradeFilters
        categories={categories}
        categoryStatus="success"
        selectedCategoryId={null}
        status={null}
        sortOrder="latest"
        onSelectCategory={onSelectCategory}
        onChangeStatus={onChangeStatus}
        onChangeSortOrder={onChangeSortOrder}
      />,
    );

    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: '치이카와' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: '교환 상태' }),
      'IN_PROGRESS',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: '정렬' }),
      'oldest',
    );

    expect(onSelectCategory).toHaveBeenCalledWith(2);
    expect(onChangeStatus).toHaveBeenCalledWith('IN_PROGRESS');
    expect(onChangeSortOrder).toHaveBeenCalledWith('oldest');
  });

  it('카테고리 API에 없는 핫키는 선택할 수 없게 표시한다', () => {
    render(
      <TradeFilters
        categories={[
          ...categories.slice(0, 4),
          { categoryId: null, name: '디즈니' },
        ]}
        categoryStatus="success"
        selectedCategoryId={null}
        status={null}
        sortOrder="latest"
        onSelectCategory={jest.fn()}
        onChangeStatus={jest.fn()}
        onChangeSortOrder={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '디즈니' })).toBeDisabled();
  });
});
