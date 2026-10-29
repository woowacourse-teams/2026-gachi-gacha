import { afterEach, describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import LandingTour, {
  HERMES_TECH_ARTICLE_URL,
  type LandingTourStepIndex,
} from './LandingTour';

interface ButtonBounds {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

const originalInnerWidth = window.innerWidth;
const originalInnerHeight = window.innerHeight;

function setViewport(
  clientWidth: number,
  clientHeight: number,
  scrollbarWidth = 0,
) {
  Object.defineProperties(document.documentElement, {
    clientWidth: { configurable: true, value: clientWidth },
    clientHeight: { configurable: true, value: clientHeight },
  });
  Object.defineProperties(window, {
    innerWidth: {
      configurable: true,
      value: clientWidth + scrollbarWidth,
    },
    innerHeight: { configurable: true, value: clientHeight },
  });
}

function expectButtonCenteredInHighlight(
  container: HTMLElement,
  target: string,
  button: ButtonBounds,
) {
  const focusSpot = container.querySelector<HTMLElement>(
    `[data-landing-tour-focus="${target}"]`,
  );

  expect(focusSpot).not.toBeNull();

  const left = Number.parseFloat(focusSpot?.style.left ?? 'NaN');
  const top = Number.parseFloat(focusSpot?.style.top ?? 'NaN');
  const width = Number.parseFloat(focusSpot?.style.width ?? 'NaN');
  const height = Number.parseFloat(focusSpot?.style.height ?? 'NaN');
  const right = left + width;
  const bottom = top + height;

  expect(left).toBeLessThanOrEqual(button.left);
  expect(top).toBeLessThanOrEqual(button.top);
  expect(right).toBeGreaterThanOrEqual(button.right);
  expect(bottom).toBeGreaterThanOrEqual(button.bottom);
  expect(left + width / 2).toBeCloseTo((button.left + button.right) / 2);
  expect(top + height / 2).toBeCloseTo((button.top + button.bottom) / 2);
}

afterEach(() => {
  Reflect.deleteProperty(document.documentElement, 'clientWidth');
  Reflect.deleteProperty(document.documentElement, 'clientHeight');
  Object.defineProperties(window, {
    innerWidth: { configurable: true, value: originalInnerWidth },
    innerHeight: { configurable: true, value: originalInnerHeight },
  });
});

describe('LandingTour', () => {
  it('대표 서비스 소개 문구는 첫 단계에만 보여준다', () => {
    const { rerender } = render(<LandingTour stepIndex={0} />);

    expect(screen.getByText('가치가챠')).toBeInTheDocument();
    expect(screen.getByText(/중복 굿즈는 가까운 사람과/)).toBeInTheDocument();

    rerender(<LandingTour stepIndex={1} />);

    expect(screen.queryByText('가치가챠')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/중복 굿즈는 가까운 사람과/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '원하는 가챠를 지도에서 찾아보세요!',
      }),
    ).toBeInTheDocument();
  });

  it('데스크톱 스냅샷의 버튼을 하이라이트 중앙에 빠짐없이 표시한다', () => {
    setViewport(1440, 900, 17);
    const { container, rerender } = render(<LandingTour stepIndex={0} />);
    const cases: Array<{
      bounds: ButtonBounds;
      stepIndex: LandingTourStepIndex;
      target: string;
    }> = [
      {
        stepIndex: 0,
        target: 'create',
        bounds: { left: 1341, top: 816, right: 1401, bottom: 876 },
      },
      {
        stepIndex: 1,
        target: 'map',
        bounds: { left: 1112, top: 17, right: 1194, bottom: 59 },
      },
      {
        stepIndex: 2,
        target: 'search',
        bounds: { left: 1200, top: 17, right: 1282, bottom: 59 },
      },
      {
        stepIndex: 3,
        target: 'chat',
        bounds: { left: 1255, top: 16, right: 1297, bottom: 58 },
      },
      {
        stepIndex: 4,
        target: 'notification',
        bounds: { left: 1303, top: 16, right: 1345, bottom: 58 },
      },
    ];

    for (const testCase of cases) {
      rerender(<LandingTour stepIndex={testCase.stepIndex} />);
      expectButtonCenteredInHighlight(
        container,
        testCase.target,
        testCase.bounds,
      );
    }
  });

  it('모바일 스냅샷의 버튼을 하이라이트 중앙에 빠짐없이 표시한다', () => {
    setViewport(390, 720);
    const { container, rerender } = render(<LandingTour stepIndex={0} />);
    const cases: Array<{
      bounds: ButtonBounds;
      stepIndex: LandingTourStepIndex;
      target: string;
    }> = [
      {
        stepIndex: 0,
        target: 'create',
        bounds: { left: 303, top: 648, right: 359, bottom: 704 },
      },
      {
        stepIndex: 1,
        target: 'map',
        bounds: { left: 111, top: 10, right: 171, bottom: 48 },
      },
      {
        stepIndex: 2,
        target: 'search',
        bounds: { left: 173, top: 10, right: 233, bottom: 48 },
      },
      {
        stepIndex: 3,
        target: 'chat',
        bounds: { left: 251, top: 11, right: 287, bottom: 47 },
      },
      {
        stepIndex: 4,
        target: 'notification',
        bounds: { left: 289, top: 11, right: 325, bottom: 47 },
      },
    ];

    for (const testCase of cases) {
      rerender(<LandingTour stepIndex={testCase.stepIndex} />);
      expectButtonCenteredInHighlight(
        container,
        testCase.target,
        testCase.bounds,
      );
    }
  });

  it('브라우저가 렌더링한 스냅샷 기준점의 실제 위치를 우선 사용한다', () => {
    setViewport(1440, 900, 17);
    const marker = document.createElement('span');
    marker.dataset.landingTourSnapshotTarget = 'create';
    marker.getBoundingClientRect = () =>
      ({
        bottom: 785,
        height: 90,
        left: 1250,
        right: 1340,
        top: 695,
        width: 90,
        x: 1250,
        y: 695,
        toJSON: () => undefined,
      }) satisfies DOMRect;
    document.body.appendChild(marker);

    const { container } = render(<LandingTour stepIndex={0} />);
    const focusSpot = container.querySelector<HTMLElement>(
      '[data-landing-tour-focus="create"]',
    );

    expect(focusSpot?.style.left).toBe('1250px');
    expect(focusSpot?.style.top).toBe('695px');
    expect(focusSpot?.style.width).toBe('90px');
    expect(focusSpot?.style.height).toBe('90px');

    marker.remove();
  });

  it('마지막 단계에서 현재 알림과 준비 중인 Hermes 기술을 구분해 안내한다', () => {
    render(<LandingTour stepIndex={4} />);

    expect(
      screen.getByRole('heading', {
        name: '놓치기 쉬운 가챠 소식을 알림으로 만나보세요!',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/댓글 알림은 지금 바로 확인/)).toBeInTheDocument();
    expect(
      screen.getByText(/공식 사이트의 신상 소식도 받아볼 수 있도록 준비/),
    ).toBeInTheDocument();

    const technologyLink = screen.getByRole('link', {
      name: /기술 블로그에서 더 알아보기/,
    });

    expect(technologyLink).toHaveAttribute('href', HERMES_TECH_ARTICLE_URL);
    expect(technologyLink).toHaveAttribute('target', '_blank');
    expect(
      screen.getByRole('button', { name: /가치가챠 시작하기/ }),
    ).toBeInTheDocument();
  });
});
