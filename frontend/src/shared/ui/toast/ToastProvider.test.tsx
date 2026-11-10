import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { ToastProvider, useToast, type ToastOptions } from './ToastProvider';

function Trigger({ options }: { options: ToastOptions }) {
  const { showToast } = useToast();

  return (
    <button type="button" onClick={() => showToast(options)}>
      알리기
    </button>
  );
}

function renderTrigger(options: ToastOptions) {
  return render(
    <ToastProvider>
      <Trigger options={options} />
    </ToastProvider>,
  );
}

describe('ToastProvider', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('메시지를 보여주고 정해진 시간이 지나면 사라진다', () => {
    jest.useFakeTimers();
    renderTrigger({ message: '저장했어요.' });

    fireEvent.click(screen.getByRole('button', { name: '알리기' }));
    expect(screen.getByRole('status')).toHaveTextContent('저장했어요.');

    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(screen.queryByText('저장했어요.')).not.toBeInTheDocument();
  });

  it('오류는 바로 알리고, 다시 시도를 누르면 동작을 실행한 뒤 닫는다', () => {
    const onRetry = jest.fn();
    renderTrigger({
      tone: 'error',
      message: '등록하지 못했어요. 내용은 그대로예요.',
      action: { label: '다시 시도', onClick: onRetry },
    });

    fireEvent.click(screen.getByRole('button', { name: '알리기' }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('등록하지 못했어요. 내용은 그대로예요.');

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText('등록하지 못했어요. 내용은 그대로예요.'),
    ).not.toBeInTheDocument();
  });

  it('Provider 밖에서 쓰면 바로 알 수 있게 오류를 낸다', () => {
    const spy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => render(<Trigger options={{ message: '알림' }} />)).toThrow(
      'useToast는 ToastProvider 안에서 사용해야 합니다.',
    );
    spy.mockRestore();
  });
});
