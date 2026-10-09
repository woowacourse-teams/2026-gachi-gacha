import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import { TradeStatusBadge } from './TradeStatusBadge';

describe('TradeStatusBadge', () => {
  it.each([
    ['AVAILABLE', '교환 가능'],
    ['IN_PROGRESS', '교환 진행 중'],
    ['COMPLETED', '교환 완료'],
  ] as const)('%s 상태를 %s로 표시한다', (status, label) => {
    render(<TradeStatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
