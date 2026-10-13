import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TradeComments } from './TradeComments';
import type { TradeCommentSubmission } from '../../model/tradeComment';
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
    const onSubmit = jest.fn<(submission: TradeCommentSubmission) => void>();

    render(<TradeComments viewer={COMMENT_VIEWER} onSubmit={onSubmit} />);

    await user.type(
      screen.getByRole('textbox', { name: '댓글 내용' }),
      '  교환 가능할까요?  ',
    );
    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(onSubmit).toHaveBeenCalledWith({
      nickname: null,
      content: '교환 가능할까요?',
    });
    expect(screen.getByRole('textbox', { name: '댓글 내용' })).toHaveValue('');
  });

  it('비회원은 선택한 이름으로 댓글을 등록할 수 있다', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn<(submission: TradeCommentSubmission) => void>();

    render(<TradeComments onSubmit={onSubmit} />);

    expect(
      screen.getByText('비회원 댓글에는 접속 IP 일부가 표시돼요.'),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: '비회원 닉네임' }),
      '홍길동',
    );
    await user.type(
      screen.getByRole('textbox', { name: '댓글 내용' }),
      '교환하고 싶어요.',
    );
    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(onSubmit).toHaveBeenCalledWith({
      nickname: '홍길동',
      content: '교환하고 싶어요.',
    });
  });

  it('비회원 댓글에 서버가 제공한 마스킹 IP 포함 이름을 표시한다', () => {
    render(<TradeComments comments={TRADE_COMMENTS} />);

    expect(screen.getByText('루챠-118.44')).toBeInTheDocument();
  });

  it('등록 중에는 중복 제출을 막고 성공한 뒤 입력값을 비운다', async () => {
    const user = userEvent.setup();
    let finishSubmit: (() => void) | undefined;
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishSubmit = resolve;
        }),
    );

    render(<TradeComments viewer={COMMENT_VIEWER} onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox', { name: '댓글 내용' });
    await user.type(input, '교환 가능할까요?');
    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(screen.getByRole('button', { name: '등록 중...' })).toBeDisabled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('교환 가능할까요?');

    finishSubmit?.();

    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('등록에 실패하면 입력값을 보존하고 오류를 안내한다', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn(async () => {
      throw new Error('댓글 등록 실패');
    });

    render(<TradeComments viewer={COMMENT_VIEWER} onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox', { name: '댓글 내용' });
    await user.type(input, '지우지 말아주세요.');
    await user.click(screen.getByRole('button', { name: '등록' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '댓글을 등록하지 못했어요. 다시 시도해주세요.',
    );
    expect(input).toHaveValue('지우지 말아주세요.');
  });

  it('API 콜백이 없으면 입력과 등록을 비활성화한다', () => {
    render(<TradeComments viewer={COMMENT_VIEWER} />);

    expect(screen.getByRole('textbox', { name: '댓글 내용' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();
    expect(screen.getByText('댓글 기능 준비 중')).toBeInTheDocument();
  });
});
