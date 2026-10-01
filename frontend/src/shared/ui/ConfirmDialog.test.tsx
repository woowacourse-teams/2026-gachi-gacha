import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

function renderDialog(props: Partial<ConfirmDialogProps> = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  render(
    <ConfirmDialog
      open
      title="교환 글을 삭제할까요?"
      description="삭제하면 되돌릴 수 없어요."
      confirmLabel="삭제"
      pendingLabel="삭제 중..."
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );

  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('열리면 제목과 설명을 가진 alertdialog로 보이고 취소 버튼에 포커스한다', () => {
    renderDialog();

    expect(
      screen.getByRole('alertdialog', { name: '교환 글을 삭제할까요?' }),
    ).toHaveAccessibleDescription('삭제하면 되돌릴 수 없어요.');
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
  });

  it('확인 버튼은 onConfirm, 취소 버튼과 Esc는 onCancel을 호출한다', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();

    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '취소' }));
    await user.keyboard('{Escape}');

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('처리 중에는 버튼을 비활성화하고 닫히지 않으며 오류를 안내한다', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog({
      isPending: true,
      errorMessage: '삭제하지 못했습니다.',
    });

    expect(screen.getByRole('button', { name: '삭제 중...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('삭제하지 못했습니다.');

    await user.keyboard('{Escape}');

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('닫혀 있으면 아무것도 렌더링하지 않는다', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
