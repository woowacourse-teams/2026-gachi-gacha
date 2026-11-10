import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StoreListPanel } from './StoreListPanel';
import { nearbyStoresMockResponse } from '../../mocks/nearbyStoresMock';

jest.mock('@/features/affiliateCatalog/AffiliateCatalogSlot', () => ({
  AffiliateCatalogSlot: ({
    categoryNames,
    title,
  }: {
    categoryNames?: readonly string[];
    title?: string;
  }) => (
    <div data-testid="affiliate-catalog-slot">
      {categoryNames?.join(',')}|{title}
    </div>
  ),
}));

const noop = jest.fn();

describe('StoreListPanel', () => {
  it('가챠 미선택 상태에서 홍대 전체 매장으로 안내한다', () => {
    render(
      <StoreListPanel
        storesState={{
          status: 'success',
          data: nearbyStoresMockResponse.data,
          errorMessage: null,
        }}
        isGachaSelected={false}
        selectedStoreId={null}
        onOpenStore={noop}
        onSelectStore={noop}
        onRetry={noop}
      />,
    );

    expect(screen.getByText('홍대 가챠 매장')).toBeInTheDocument();
    expect(screen.getByText('홍대 매장')).toBeInTheDocument();
    expect(screen.getByText('3곳')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent(
      '3개 매장 중 1번째 매장',
    );
  });

  it('가챠 검색 결과가 한 곳이면 매장 수만 안내한다', () => {
    render(
      <StoreListPanel
        storesState={{
          status: 'success',
          data: {
            ...nearbyStoresMockResponse.data,
            stores: nearbyStoresMockResponse.data.stores.slice(0, 1),
          },
          errorMessage: null,
        }}
        isGachaSelected
        selectedStoreId={null}
        onOpenStore={noop}
        onSelectStore={noop}
        onRetry={noop}
      />,
    );

    expect(screen.getByText('검색 결과')).toBeInTheDocument();
    expect(screen.getByText('1곳')).toBeInTheDocument();
    expect(screen.queryByText(/1 \/ 1/)).not.toBeInTheDocument();
  });

  it('선택한 가챠 제목과 카테고리를 제휴 카탈로그에 전달한다', () => {
    render(
      <StoreListPanel
        storesState={{
          status: 'success',
          data: nearbyStoresMockResponse.data,
          errorMessage: null,
        }}
        isGachaSelected
        affiliateCategoryNames={['피규어']}
        affiliateTitle="산리오캐릭터 가챠"
        selectedStoreId={null}
        onOpenStore={noop}
        onSelectStore={noop}
        onRetry={noop}
      />,
    );

    expect(screen.getByTestId('affiliate-catalog-slot')).toHaveTextContent(
      '피규어|산리오캐릭터 가챠',
    );
  });
  it('목록 시트에서 선택하면 지도의 매장 선택을 갱신하고 시트를 닫는다', async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      },
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: true }),
    });
    const user = userEvent.setup();
    const select = jest.fn();
    render(
      <StoreListPanel
        storesState={{
          status: 'success',
          data: nearbyStoresMockResponse.data,
          errorMessage: null,
        }}
        isGachaSelected={false}
        selectedStoreId={null}
        onOpenStore={noop}
        onSelectStore={select}
        onRetry={noop}
      />,
    );

    await user.click(screen.getByText(/목록 보기/));
    const sheet = screen.getByRole('dialog', { name: '매장 목록' });
    await user.click(
      within(sheet).getByRole('button', { name: /홍대 가챠 스테이션/ }),
    );
    expect(select).toHaveBeenCalledWith(1);
    expect(sheet).not.toHaveAttribute('open');
  });
});
