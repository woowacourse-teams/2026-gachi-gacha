import { useState } from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { TradeCategory } from '@/domains/trade/tradeCategoryType';

import TradeCategoryField from './TradeCategoryField';
import { useTradeCategories } from '../../useTradeCategories';

jest.mock('../../useTradeCategories');

const mockedUseTradeCategories = jest.mocked(useTradeCategories);
const categories: [TradeCategory, TradeCategory, TradeCategory] = [
  { categoryId: 1, name: '치이카와' },
  { categoryId: 2, name: '하치와레' },
  { categoryId: 3, name: '우사기' },
];

function Harness({
  initialCategories = [],
  onSelect = () => {},
}: {
  initialCategories?: TradeCategory[];
  onSelect?: (category: TradeCategory) => void;
}) {
  const [selected, setSelected] = useState(initialCategories);

  return (
    <TradeCategoryField
      selectedCategories={selected}
      onSelect={(category) => {
        onSelect(category);
        setSelected((current) => [...current, category]);
      }}
      onRemove={(categoryId) =>
        setSelected((current) =>
          current.filter((category) => category.categoryId !== categoryId),
        )
      }
    />
  );
}

beforeEach(() => {
  mockedUseTradeCategories.mockImplementation((keyword) =>
    keyword
      ? { status: 'success', data: categories, errorMessage: null }
      : { status: 'idle', data: null, errorMessage: null },
  );
});

describe('TradeCategoryField', () => {
  it('검색 입력의 이름·필수 상태와 검색 키 안내를 제공한다', () => {
    render(
      <TradeCategoryField
        selectedCategories={[]}
        onSelect={jest.fn()}
        onRemove={jest.fn()}
        invalid
      />,
    );

    const input = screen.getByRole('searchbox', { name: '카테고리' });
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('enterkeyhint', 'search');
    expect(input).toHaveAccessibleDescription(
      /검색 버튼을 누르면 첫 검색 결과로 이동합니다/,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('선택 가능한 결과에 추가 동작을 명시하고 선택한 카테고리는 제외한다', async () => {
    const user = userEvent.setup();
    render(<Harness initialCategories={[categories[0]]} />);
    await user.type(screen.getByRole('searchbox'), '캐릭터');

    const results = screen.getByRole('group', { name: '카테고리 검색 결과' });
    expect(
      within(results).queryByRole('button', {
        name: '치이카와 카테고리에 추가',
      }),
    ).not.toBeInTheDocument();
    expect(within(results).getAllByRole('button')).toHaveLength(2);
    expect(
      within(results).getByRole('button', { name: '하치와레 카테고리에 추가' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      '캐릭터 검색 결과 2개.',
    );
  });

  it('검색 Enter는 첫 결과로 초점만 이동하고 카테고리를 임의로 추가하지 않는다', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn<(category: TradeCategory) => void>();
    render(<Harness onSelect={onSelect} />);

    await user.type(screen.getByRole('searchbox'), '치이');
    await user.keyboard('{Enter}');

    expect(
      screen.getByRole('button', { name: '치이카와 카테고리에 추가' }),
    ).toHaveFocus();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('입력 다음의 결과 이동 버튼으로 선택 칩을 건너뛰고 첫 결과를 탐색할 수 있다', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn<(category: TradeCategory) => void>();
    render(<Harness initialCategories={[categories[0]]} onSelect={onSelect} />);

    expect(
      screen.queryByRole('button', { name: '카테고리 검색 결과로 이동' }),
    ).not.toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), '하치');
    await user.tab();
    expect(
      screen.getByRole('button', { name: '카테고리 검색 결과로 이동' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('button', { name: '하치와레 카테고리에 추가' }),
    ).toHaveFocus();
    expect(onSelect).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(
      screen.queryByRole('button', { name: '카테고리 검색 결과로 이동' }),
    ).not.toBeInTheDocument();
  });

  it('한글 조합 확정 Enter에서는 초점을 옮기거나 카테고리를 추가하지 않는다', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn<(category: TradeCategory) => void>();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole('searchbox');
    await user.type(input, '치이');

    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(input).toHaveFocus();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('추가 후 검색을 비우고 새 선택 칩에 초점을 이어가며 중복 안내는 탐색에서 제외한다', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const input = screen.getByRole('searchbox');
    await user.type(input, '치이');
    await user.click(
      screen.getByRole('button', { name: '치이카와 카테고리에 추가' }),
    );

    expect(input).toHaveValue('');
    expect(
      screen.getByRole('button', { name: '치이카와 카테고리 선택 해제' }),
    ).toHaveFocus();
    expect(
      screen.queryByRole('group', { name: '카테고리 검색 결과' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /카테고리에 추가/ }),
    ).toBeNull();
    expect(screen.getByText('카테고리를 검색해주세요.')).toBeVisible();
    expect(container.querySelector('input[name="categoryIds"]')).toHaveValue(
      '1',
    );
  });

  it('선택 후에도 검색 입력으로 돌아와 다른 카테고리를 추가할 수 있다', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn<(category: TradeCategory) => void>();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole('searchbox');

    await user.type(input, '치이');
    await user.click(
      screen.getByRole('button', { name: '치이카와 카테고리에 추가' }),
    );
    await user.type(input, '하치');
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('button', { name: '하치와레 카테고리에 추가' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole('button', { name: '하치와레 카테고리 선택 해제' }),
    ).toHaveFocus();
    expect(
      within(
        screen.getByRole('group', { name: '선택한 카테고리' }),
      ).getAllByRole('button'),
    ).toHaveLength(2);
    expect(input).toBeInTheDocument();
  });

  it('삭제하면 다음 칩, 이전 칩, 마지막 삭제 후 입력 순으로 초점을 이어간다', async () => {
    const user = userEvent.setup();
    render(<Harness initialCategories={categories} />);

    await user.click(
      screen.getByRole('button', { name: '하치와레 카테고리 선택 해제' }),
    );
    expect(
      screen.getByRole('button', { name: '우사기 카테고리 선택 해제' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('button', { name: '치이카와 카테고리 선택 해제' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expect(
      screen.getByRole('group', { name: '카테고리 검색 결과' }),
    ).not.toHaveAttribute('aria-hidden');
  });

  it('검색어가 바뀌어 로딩하면 지난 검색 결과의 추가 버튼을 남기지 않는다', async () => {
    const user = userEvent.setup();
    mockedUseTradeCategories.mockImplementation((keyword) =>
      keyword === '치이'
        ? { status: 'success', data: [categories[0]], errorMessage: null }
        : { status: 'loading', data: null, errorMessage: null },
    );
    render(<Harness />);
    const input = screen.getByRole('searchbox');
    await user.type(input, '치이');
    expect(
      screen.getByRole('button', { name: '치이카와 카테고리에 추가' }),
    ).toBeInTheDocument();

    await user.type(input, '카');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('카테고리를 불러오는 중...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.keyboard('{Enter}');
    expect(input).toHaveFocus();
  });

  it('빈 결과와 검색 오류를 알리고 입력은 계속 사용할 수 있게 한다', async () => {
    const user = userEvent.setup();
    mockedUseTradeCategories.mockImplementation((keyword) =>
      keyword === '빈'
        ? { status: 'success', data: [], errorMessage: null }
        : { status: 'error', data: null, errorMessage: '검색하지 못했어요.' },
    );
    render(<Harness />);
    const input = screen.getByRole('searchbox');
    await user.type(input, '빈');
    expect(screen.getByRole('status')).toHaveTextContent('빈 검색 결과 0개.');
    expect(screen.getByText('검색결과가 없어요.')).toBeInTheDocument();

    await user.type(input, '칸');
    expect(screen.getByRole('alert')).toHaveTextContent('검색하지 못했어요.');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
