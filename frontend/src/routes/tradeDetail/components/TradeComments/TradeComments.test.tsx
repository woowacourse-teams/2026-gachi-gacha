import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TradeComments } from './TradeComments';
import {
  COMMENT_VIEWER,
  TRADE_COMMENTS,
} from '../../storybook/tradeCommentMocks';

describe('TradeComments', () => {
  it('댓글 개수를 표시하고 대댓글 액션은 제공하지 않는다', () => {
    render(<TradeComments comments={TRADE_COMMENTS} />);

    expect(screen.getByRole('heading', { name: '댓글 3' })).toBeInTheDocument();
    expect(screen.getByText('작성자')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '답글' })).toBeNull();
  });

  it('정렬, 좋아요, 신고 기능은 제공하지 않는다', () => {
    render(<TradeComments comments={TRADE_COMMENTS} />);

    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('button', { name: /좋아요/ })).toBeNull();
    expect(screen.queryByRole('button', { name: '신고' })).toBeNull();
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('댓글을 입력하면 공백을 제거해 등록 콜백으로 전달한다', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn<(content: string) => void>();

    render(<TradeComments viewer={COMMENT_VIEWER} onSubmit={onSubmit} />);

    await user.type(
      screen.getByRole('textbox', { name: '댓글 내용' }),
      '  교환 가능할까요?  ',
    );
    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(onSubmit).toHaveBeenCalledWith('교환 가능할까요?');
    expect(screen.getByRole('textbox', { name: '댓글 내용' })).toHaveValue('');
  });

  it('API 콜백이 없으면 입력과 등록을 비활성화한다', () => {
    render(<TradeComments viewer={COMMENT_VIEWER} />);

    expect(screen.getByRole('textbox', { name: '댓글 내용' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();
    expect(screen.getByText('댓글 기능 준비 중')).toBeInTheDocument();
  });
});
