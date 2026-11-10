import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import { AppErrorFallback } from './AppErrorFallback';

describe('앱 최상위 오류 복구 화면', () => {
  it('서버 오류 안내를 보여주고 사용자가 다시 시도할 수 있다', () => {
    const onReload = jest.fn();
    render(<AppErrorFallback onReload={onReload} />);
    expect(screen.getByRole('alert')).toHaveTextContent('잠시 문제가 생겼어요');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '잠시 후 다시 시도해 주세요.',
    );
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
