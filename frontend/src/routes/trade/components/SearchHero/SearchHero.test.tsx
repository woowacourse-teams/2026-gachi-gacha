import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SearchHero from './SearchHero';

describe('중고거래 검색 히어로', () => {
  it('공백을 정리한 게시글 검색어를 전달한다', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();

    render(
      <SearchHero title="어떤 가챠를 교환해볼까요?" onSearch={onSearch} />,
    );

    await user.type(
      screen.getByRole('searchbox', { name: '중고거래 게시글 검색어' }),
      '  쿠로미 키링  ',
    );
    await user.click(screen.getByRole('button', { name: '검색' }));

    expect(onSearch).toHaveBeenCalledWith('쿠로미 키링');
  });
});
