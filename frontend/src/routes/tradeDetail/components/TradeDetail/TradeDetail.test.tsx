import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import TradeDetail from './TradeDetail';
import { TRADE_DETAIL } from '../../storybook/tradeDetailMocks';

describe('TradeDetail', () => {
  it('게시글의 채팅하기 링크만 보여준다', () => {
    render(<TradeDetail detail={TRADE_DETAIL} />);

    expect(screen.getByRole('link', { name: '채팅하기' })).toHaveAttribute(
      'href',
      '/chat',
    );
    expect(
      screen.queryByRole('button', { name: '교환 제안하기' }),
    ).not.toBeInTheDocument();
  });

  it('작성자에게는 채팅하기 대신 수정하기 링크를 보여준다', () => {
    render(<TradeDetail detail={TRADE_DETAIL} action="edit" />);

    expect(screen.getByRole('link', { name: '수정하기' })).toHaveAttribute(
      'href',
      `/trade/${TRADE_DETAIL.tradeId}/edit`,
    );
    expect(
      screen.queryByRole('link', { name: '채팅하기' }),
    ).not.toBeInTheDocument();
  });

  it('로그인 상태를 확인하는 동안에는 액션을 표시하지 않는다', () => {
    render(<TradeDetail detail={TRADE_DETAIL} action={null} />);

    expect(
      screen.queryByRole('link', { name: /채팅하기|수정하기/ }),
    ).not.toBeInTheDocument();
  });
});
