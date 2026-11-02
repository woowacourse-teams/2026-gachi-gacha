import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TradeFilters } from './TradeFilters';

describe('거래 목록 필터', () => {
  it('카테고리 빠른 검색·교환 상태·정렬 변경을 각각 전달한다', async () => {
    const user = userEvent.setup();
    const onSelectQuickKeyword = jest.fn();
    const onChangeStatus = jest.fn();
    const onChangeSortOrder = jest.fn();

    render(
      <TradeFilters
        selectedQuickKeyword={null}
        status={null}
        sortOrder="latest"
        onSelectQuickKeyword={onSelectQuickKeyword}
        onChangeStatus={onChangeStatus}
        onChangeSortOrder={onChangeSortOrder}
      />,
    );

    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: '치이카와' }));
    await user.click(screen.getByRole('combobox', { name: '교환 상태' }));
    await user.click(screen.getByRole('option', { name: '진행 중' }));
    await user.click(screen.getByRole('combobox', { name: '정렬' }));
    await user.click(screen.getByRole('option', { name: '오래된순' }));

    expect(onSelectQuickKeyword).toHaveBeenCalledWith('치이카와');
    expect(onChangeStatus).toHaveBeenCalledWith('IN_PROGRESS');
    expect(onChangeSortOrder).toHaveBeenCalledWith('oldest');
  });

  it('선택된 빠른 검색어를 눌린 상태로 표시한다', () => {
    render(
      <TradeFilters
        selectedQuickKeyword="디즈니"
        status={null}
        sortOrder="latest"
        onSelectQuickKeyword={jest.fn()}
        onChangeStatus={jest.fn()}
        onChangeSortOrder={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '디즈니' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
