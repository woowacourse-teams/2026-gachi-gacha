import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import { StoreListPanel } from './StoreListPanel';
import { nearbyStoresMockResponse } from '../../mocks/nearbyStoresMock';

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
});
