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
  });
});
