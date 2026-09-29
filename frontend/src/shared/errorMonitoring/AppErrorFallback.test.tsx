import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import { AppErrorFallback } from './AppErrorFallback';

describe('앱 최상위 오류 복구 화면', () => {
  it('오류 안내를 보여주고 사용자가 새로고침을 요청할 수 있다', () => {
    const onReload = jest.fn();

    render(<AppErrorFallback onReload={onReload} />);

    expect(screen.getByRole('alert')).toHaveTextContent('문제가 발생했어요');
    fireEvent.click(screen.getByRole('button', { name: '새로고침' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
