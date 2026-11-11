import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { SITE_FOOTER_ID } from '@/shared/ui/SiteFooter';

import CreateTradeButton, {
  calculateSiteFooterOverlap,
} from './CreateTradeButton';

const originalInnerHeight = window.innerHeight;
const originalRequestAnimationFrame = window.requestAnimationFrame;
const originalCancelAnimationFrame = window.cancelAnimationFrame;

function setViewportHeight(value: number) {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value,
  });
}

function installSynchronousAnimationFrame() {
  Object.defineProperties(window, {
    requestAnimationFrame: {
      configurable: true,
      value: jest.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    },
    cancelAnimationFrame: {
      configurable: true,
      value: jest.fn(),
    },
  });
}

afterEach(() => {
  document.getElementById(SITE_FOOTER_ID)?.remove();
  setViewportHeight(originalInnerHeight);
  Object.defineProperties(window, {
    requestAnimationFrame: {
      configurable: true,
      value: originalRequestAnimationFrame,
    },
    cancelAnimationFrame: {
      configurable: true,
      value: originalCancelAnimationFrame,
    },
  });
  jest.restoreAllMocks();
});

describe('CreateTradeButton', () => {
  it('모바일 글쓰기의 보이는 문구를 접근 가능한 이름에도 포함한다', () => {
    render(
      <MemoryRouter>
        <CreateTradeButton placement="mobile" />
      </MemoryRouter>,
    );

    const createLink = screen.getByLabelText('교환 글쓰기');

    expect(createLink).toHaveTextContent('글쓰기');
    expect(createLink).toHaveAttribute('href', '/trade/new');
    expect(createLink).toHaveAttribute('data-placement', 'mobile');
    expect(createLink).not.toHaveAttribute('tabindex');
    expect(createLink).toHaveStyle({ position: 'fixed' });
  });

  it('푸터가 화면 밖에 있으면 기존 우하단 위치를 유지한다', () => {
    setViewportHeight(800);
    installSynchronousAnimationFrame();

    const footer = document.createElement('footer');
    footer.id = SITE_FOOTER_ID;
    jest.spyOn(footer, 'getBoundingClientRect').mockReturnValue({
      top: 900,
    } as DOMRect);
    document.body.append(footer);

    render(
      <MemoryRouter>
        <CreateTradeButton />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '교환 글쓰기' })).toHaveStyle({
      '--site-footer-overlap': '0px',
    });
  });

  it('푸터가 화면에 들어온 높이만큼 버튼을 위로 이동하고 다시 복귀한다', () => {
    setViewportHeight(800);
    installSynchronousAnimationFrame();

    let footerTop = 900;
    const footer = document.createElement('footer');
    footer.id = SITE_FOOTER_ID;
    jest.spyOn(footer, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: footerTop,
        }) as DOMRect,
    );
    document.body.append(footer);

    render(
      <MemoryRouter>
        <CreateTradeButton />
      </MemoryRouter>,
    );
    const createButton = screen.getByRole('link', { name: '교환 글쓰기' });

    footerTop = 712;
    act(() => fireEvent.scroll(window));
    expect(createButton).toHaveStyle({ '--site-footer-overlap': '88px' });

    footerTop = 900;
    act(() => fireEvent.scroll(window));
    expect(createButton).toHaveStyle({ '--site-footer-overlap': '0px' });
  });

  it('푸터 상단과 뷰포트 하단의 차이만 겹침 높이로 계산한다', () => {
    expect(calculateSiteFooterOverlap(712, 800)).toBe(88);
    expect(calculateSiteFooterOverlap(800, 800)).toBe(0);
    expect(calculateSiteFooterOverlap(900, 800)).toBe(0);
  });
});
