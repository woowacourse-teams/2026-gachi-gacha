import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CategoryNav from './CategoryNav';

describe('CategoryNav', () => {
  it('지원하는 카테고리만 노출하고 선택을 전달한다', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(<CategoryNav selected="산리오" onSelect={onSelect} />);

    expect(
      screen.queryByRole('button', { name: '애니메이션' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '게임' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '산리오' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: '치이카와' }));

    expect(onSelect).toHaveBeenCalledWith('치이카와');
  });
});
