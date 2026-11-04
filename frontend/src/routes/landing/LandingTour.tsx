import { useLayoutEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { breakpoint, color, shadow } from '@/shared/styles/tokens';

import {
  DESKTOP_SNAPSHOT_SIZE,
  DESKTOP_TARGET_RECTS,
  LANDING_TOUR_TARGETS,
  type LandingTourTarget,
  MOBILE_SNAPSHOT_SIZE,
  MOBILE_TARGET_RECTS,
} from './landingTourGeometry';

export const HERMES_TECH_ARTICLE_URL =
  'https://github.com/woowacourse-teams/2026-gachi-gacha/wiki';

interface LandingTourTechnology {
  description: string;
  href: string;
  linkLabel: string;
  title: string;
}

interface LandingTourStep {
  description: string;
  instruction: string;
  label: string;
  target: LandingTourTarget;
  technology?: LandingTourTechnology | undefined;
}

export const LANDING_TOUR_STEPS = [
  {
    target: LANDING_TOUR_TARGETS[0],
    label: '첫 번째 · 교환글 작성',
    instruction: '여기서 교환글을 작성해 봐요!',
    description: '사진과 원하는 교환 조건을 올리면 가까운 사람과 연결돼요.',
    technology: undefined,
  },
  {
    target: LANDING_TOUR_TARGETS[1],
    label: '두 번째 · 지도 탐색',
    instruction: '원하는 가챠를 지도에서 찾아보세요!',
    description: '내 주변 매장과 원하는 가챠를 보유한 매장을 한눈에 살펴봐요.',
    technology: undefined,
  },
  {
    target: LANDING_TOUR_TARGETS[2],
    label: '세 번째 · 키워드 검색',
    instruction: '원하는 가챠를 키워드로 검색해 보세요!',
    description: '가챠를 고르면 어느 매장이 보유 중인지 바로 확인할 수 있어요.',
    technology: undefined,
  },
  {
    target: LANDING_TOUR_TARGETS[3],
    label: '네 번째 · 채팅 확인',
    instruction: '교환글 작성자와 나눈 채팅을 한눈에 확인해 보세요!',
    description:
      '로그인하면 교환 대화와 진행 중인 거래를 한곳에서 확인할 수 있어요.',
    technology: undefined,
  },
  {
    target: LANDING_TOUR_TARGETS[4],
    label: '다섯 번째 · 알림',
    instruction: '놓치기 쉬운 소식을 알림으로 만나보세요!',
    description:
      '댓글 알림은 지금 바로 확인할 수 있고, 공식 사이트의 신상 소식도 받아볼 수 있도록 준비하고 있어요.',
    technology: {
      title: 'Hermes로 준비하는 신상 알림',
      description: '신상 알림도 기대해 주세요!',
      href: HERMES_TECH_ARTICLE_URL,
      linkLabel: '가치가챠 wiki에서 알아보기',
    },
  },
] as const satisfies readonly LandingTourStep[];

export type LandingTourStepIndex = 0 | 1 | 2 | 3 | 4;

interface ViewportSize {
  width: number;
  height: number;
}

interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ArrowGeometry {
  curve: string;
  head: string;
}

function readViewportSize(): ViewportSize {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return DESKTOP_SNAPSHOT_SIZE;
  }

  return {
    // fixed 요소가 실제로 차지하는 레이아웃 뷰포트를 사용해야
    // 스크롤바 폭만큼 하이라이트가 오른쪽으로 밀리지 않습니다.
    width: document.documentElement.clientWidth || window.innerWidth,
    height: document.documentElement.clientHeight || window.innerHeight,
  };
}

function calculateFallbackHighlight(
  target: LandingTourTarget,
  viewport: ViewportSize,
): HighlightRect {
  const isMobile = viewport.width <= 767;
  const snapshotSize = isMobile ? MOBILE_SNAPSHOT_SIZE : DESKTOP_SNAPSHOT_SIZE;
  const sourceRect = isMobile
    ? MOBILE_TARGET_RECTS[target]
    : DESKTOP_TARGET_RECTS[target];
  const scale = Math.max(
    viewport.width / snapshotSize.width,
    viewport.height / snapshotSize.height,
  );
  const renderedWidth = snapshotSize.width * scale;
  const renderedHeight = snapshotSize.height * scale;
  const offsetX = (viewport.width - renderedWidth) / 2;
  const offsetY = target === 'create' ? viewport.height - renderedHeight : 0;

  return {
    left: offsetX + sourceRect.x * scale,
    top: offsetY + sourceRect.y * scale,
    width: sourceRect.width * scale,
    height: sourceRect.height * scale,
  };
}

function readRenderedTargetRect(
  target: LandingTourTarget,
): HighlightRect | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const markers = document.querySelectorAll<HTMLElement>(
    `[data-landing-tour-snapshot-target="${target}"]`,
  );

  for (const marker of markers) {
    const rect = marker.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    }
  }

  return null;
}

function readOverlayLayout(target: LandingTourTarget) {
  const viewport = readViewportSize();

  return {
    viewport,
    highlight:
      readRenderedTargetRect(target) ??
      calculateFallbackHighlight(target, viewport),
  };
}

function normalizeVector(x: number, y: number) {
  const length = Math.hypot(x, y) || 1;

  return { x: x / length, y: y / length };
}

function createArrowGeometry(
  rect: HighlightRect,
  target: LandingTourTarget,
  viewport: ViewportSize,
): ArrowGeometry {
  const center = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };

  let start: { x: number; y: number };
  let end: { x: number; y: number };
  let finalDirection: { x: number; y: number };

  if (target === 'map' || target === 'search') {
    end = { x: center.x, y: rect.top + rect.height };
    start = {
      x: Math.max(20, end.x - Math.min(150, viewport.width * 0.2)),
      y: end.y + Math.min(118, viewport.height * 0.16),
    };
    finalDirection = { x: 0, y: -1 };
  } else {
    start =
      target === 'create'
        ? {
            x: center.x - rect.width * 0.18,
            y: Math.max(24, center.y - Math.min(160, viewport.height * 0.2)),
          }
        : {
            x: Math.max(20, center.x - Math.min(130, viewport.width * 0.2)),
            y: center.y + Math.min(120, viewport.height * 0.16),
          };

    finalDirection = normalizeVector(center.x - start.x, center.y - start.y);
    const radius = Math.max(rect.width, rect.height) / 2;
    end = {
      x: center.x - finalDirection.x * radius,
      y: center.y - finalDirection.y * radius,
    };
  }

  const headLength = 22;
  const headHalfWidth = 10;
  const headBase = {
    x: end.x - finalDirection.x * headLength,
    y: end.y - finalDirection.y * headLength,
  };
  const lastControl = {
    x: headBase.x - finalDirection.x * 28,
    y: headBase.y - finalDirection.y * 28,
  };
  const firstControl = {
    x: start.x + (end.x - start.x) * 0.46,
    y:
      target === 'create'
        ? start.y + (end.y - start.y) * 0.18
        : start.y + (end.y - start.y) * 0.52,
  };
  const perpendicular = {
    x: -finalDirection.y,
    y: finalDirection.x,
  };
  const headLeft = {
    x: headBase.x + perpendicular.x * headHalfWidth,
    y: headBase.y + perpendicular.y * headHalfWidth,
  };
  const headRight = {
    x: headBase.x - perpendicular.x * headHalfWidth,
    y: headBase.y - perpendicular.y * headHalfWidth,
  };

  return {
    curve: `M ${start.x} ${start.y} C ${firstControl.x} ${firstControl.y}, ${lastControl.x} ${lastControl.y}, ${headBase.x} ${headBase.y}`,
    head: `M ${end.x} ${end.y} L ${headLeft.x} ${headLeft.y} Q ${headBase.x} ${headBase.y} ${headRight.x} ${headRight.y} Z`,
  };
}

function useSnapshotOverlayLayout(target: LandingTourTarget): {
  viewport: ViewportSize;
  highlight: HighlightRect;
  arrow: ArrowGeometry;
} {
  const [layout, setLayout] = useState(() => readOverlayLayout(target));

  useLayoutEffect(() => {
    const updateLayout = () => setLayout(readOverlayLayout(target));
    const markers = document.querySelectorAll<HTMLElement>(
      `[data-landing-tour-snapshot-target="${target}"]`,
    );
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateLayout);

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.visualViewport?.addEventListener('resize', updateLayout);
    markers.forEach((marker) => resizeObserver?.observe(marker));

    return () => {
      window.removeEventListener('resize', updateLayout);
      window.visualViewport?.removeEventListener('resize', updateLayout);
      resizeObserver?.disconnect();
    };
  }, [target]);

  return useMemo(() => {
    return {
      ...layout,
      arrow: createArrowGeometry(layout.highlight, target, layout.viewport),
    };
  }, [layout, target]);
}

interface LandingTourProps {
  stepIndex: LandingTourStepIndex;
  onStepChange?: (stepIndex: LandingTourStepIndex) => void;
  onComplete?: () => void;
  onSkip?: (source: 'skip_button' | 'close_button') => void;
}

/** 가치가챠의 핵심 기능과 기술을 고정 스냅샷으로 소개하는 5단계 랜딩 투어입니다. */
export default function LandingTour({
  stepIndex,
  onStepChange = () => undefined,
  onComplete = () => undefined,
  onSkip = () => undefined,
}: LandingTourProps) {
  const step = LANDING_TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === LANDING_TOUR_STEPS.length - 1;
  const overlayLayout = useSnapshotOverlayLayout(step.target);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      return;
    }

    onStepChange((stepIndex + 1) as LandingTourStepIndex);
  };

  const handlePrevious = () => {
    if (stepIndex === 0) {
      return;
    }

    onStepChange((stepIndex - 1) as LandingTourStepIndex);
  };

  return (
    <>
      <TourLayer
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-tour-instruction"
        aria-describedby="landing-tour-step-description"
      >
        <FocusSpot
          aria-hidden="true"
          data-landing-tour-focus={step.target}
          $isCircle={
            step.target === 'create' ||
            step.target === 'chat' ||
            step.target === 'notification'
          }
          style={{
            left: overlayLayout.highlight.left,
            top: overlayLayout.highlight.top,
            width: overlayLayout.highlight.width,
            height: overlayLayout.highlight.height,
          }}
        />

        <SkipIconButton
          type="button"
          aria-label="서비스 소개 건너뛰기"
          onClick={() => onSkip('close_button')}
        >
          <CloseIcon viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5l14 14M19 5 5 19" />
          </CloseIcon>
        </SkipIconButton>

        {stepIndex === 0 && (
          <ServiceCopy>
            <Eyebrow>
              <BrandName>가치가챠</BrandName>에서
            </Eyebrow>
            <ServiceTitle>
              원하는 가챠를 찾고,
              <br />
              중복 굿즈는 가까운 사람과 교환해 보세요!
            </ServiceTitle>
          </ServiceCopy>
        )}

        <StepCopy>
          <StepLabel>{step.label}</StepLabel>
          <Instruction id="landing-tour-instruction">
            {step.instruction}
          </Instruction>
          <Description id="landing-tour-step-description">
            {step.description}
          </Description>

          {step.technology && (
            <TechnologyCard>
              <TechnologyTitle>{step.technology.title}</TechnologyTitle>
              <TechnologyDescription>
                {step.technology.description}
              </TechnologyDescription>
              <TechnologyLink
                href={step.technology.href}
                target="_blank"
                rel="noreferrer"
              >
                {step.technology.linkLabel}
                <span aria-hidden="true">↗</span>
              </TechnologyLink>
            </TechnologyCard>
          )}

          <Actions>
            <Progress
              aria-label={`전체 ${LANDING_TOUR_STEPS.length}단계 중 ${stepIndex + 1}단계`}
            >
              <ProgressDots>
                {LANDING_TOUR_STEPS.map((_, index) => (
                  <ProgressDotButton
                    key={index}
                    type="button"
                    data-active={index === stepIndex}
                    aria-label={`${index + 1}단계로 이동`}
                    aria-current={index === stepIndex ? 'step' : undefined}
                    onClick={() => onStepChange(index as LandingTourStepIndex)}
                  />
                ))}
              </ProgressDots>
              <ProgressNumber>
                {stepIndex + 1} / {LANDING_TOUR_STEPS.length}
              </ProgressNumber>
            </Progress>

            <ButtonGroup>
              <SkipButton type="button" onClick={() => onSkip('skip_button')}>
                SKIP
              </SkipButton>
              {stepIndex > 0 && (
                <PreviousButton type="button" onClick={handlePrevious}>
                  이전
                </PreviousButton>
              )}
              <NextButton type="button" onClick={handleNext}>
                {isLastStep ? '가치가챠 시작하기' : '다음'}
                <span aria-hidden="true">→</span>
              </NextButton>
            </ButtonGroup>
          </Actions>
        </StepCopy>

        <CrayonArrow
          aria-hidden="true"
          viewBox={`0 0 ${overlayLayout.viewport.width} ${overlayLayout.viewport.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="landing-crayon-roughness">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.025"
                numOctaves="2"
                seed="7"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="1.8"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
          <path
            className="arrow-line"
            d={overlayLayout.arrow.curve}
            filter="url(#landing-crayon-roughness)"
          />
          <path className="arrow-head" d={overlayLayout.arrow.head} />
        </CrayonArrow>
      </TourLayer>
    </>
  );
}

const handwrittenFont = `'Gaegu', 'Nanum Pen Script', cursive`;

const TourLayer = styled.section`
  position: fixed;
  z-index: 200;
  overflow: hidden;
  color: #ffffff;
  inset: 0;
`;

const FocusSpot = styled.div<{ $isCircle: boolean }>`
  position: absolute;
  z-index: 0;
  box-sizing: border-box;
  border: 3px solid #fffdf8;
  border-radius: ${({ $isCircle }) => ($isCircle ? '50%' : '999px')};
  background: rgb(255 255 255 / 4%);
  box-shadow: 0 0 0 150vmax rgb(31 27 29 / 74%);
  pointer-events: none;
`;

const SkipIconButton = styled.button`
  position: absolute;
  z-index: 4;
  top: max(24px, env(safe-area-inset-top));
  right: max(24px, env(safe-area-inset-right));
  display: grid;
  box-sizing: border-box;
  width: 46px;
  height: 46px;
  padding: 0;
  place-items: center;
  border: 2px solid rgb(255 255 255 / 78%);
  border-radius: 50%;
  background: rgb(36 33 34 / 32%);
  color: #ffffff;
  cursor: pointer;

  &:hover {
    background: rgb(255 255 255 / 16%);
  }

  &:focus-visible {
    outline: 3px solid #ffffff;
    outline-offset: 3px;
  }

  @media (max-width: ${breakpoint.mobile}) {
    top: max(16px, env(safe-area-inset-top));
    right: max(16px, env(safe-area-inset-right));
    width: 42px;
    height: 42px;
  }
`;

const CloseIcon = styled.svg`
  display: block;
  width: 27px;
  height: 27px;
  overflow: visible;

  path {
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-width: 2.5;
  }

  @media (max-width: ${breakpoint.mobile}) {
    width: 25px;
    height: 25px;
  }
`;

const ServiceCopy = styled.div`
  position: absolute;
  z-index: 2;
  top: clamp(92px, 14vh, 148px);
  left: 50%;
  width: min(760px, calc(100% - 48px));
  text-align: center;
  text-shadow: 0 3px 18px rgb(0 0 0 / 34%);
  transform: translateX(-50%) rotate(-1deg);

  @media (max-width: ${breakpoint.mobile}) {
    top: 80px;
    left: 18px;
    width: calc(100% - 36px);
    text-align: left;
    transform: rotate(-1deg);
  }

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    top: 68px;
  }
`;

const Eyebrow = styled.p`
  margin: 0 0 6px;
  color: #ffd9df;
  font-family: ${handwrittenFont};
  font-size: clamp(21px, 2vw, 28px);
  font-weight: 700;
  letter-spacing: 0.03em;

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    margin-bottom: 3px;
    font-size: 18px;
  }
`;

const BrandName = styled.span`
  display: inline-block;
  margin-right: 4px;
  color: ${color.primary};
  font-size: 1.9em;
  line-height: 0.8;
  text-shadow:
    0 1px 0 rgb(255 241 243 / 88%),
    0 3px 14px rgb(0 0 0 / 38%);
  transform: rotate(-1deg);
`;

const ServiceTitle = styled.h1`
  margin: 0;
  color: #fffdf8;
  font-family: ${handwrittenFont};
  font-size: clamp(34px, 4.1vw, 58px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;

  @media (max-width: ${breakpoint.mobile}) {
    padding-right: 28px;
    font-size: clamp(29px, 8.8vw, 40px);
    line-height: 1.08;
  }

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    font-size: 27px;
    line-height: 1;
  }
`;

const StepCopy = styled.div`
  position: absolute;
  z-index: 2;
  right: 142px;
  bottom: max(42px, env(safe-area-inset-bottom));
  width: min(640px, calc(100% - 190px));
  text-shadow: 0 2px 12px rgb(0 0 0 / 42%);

  @media (max-width: ${breakpoint.mobile}) {
    right: 18px;
    bottom: calc(104px + env(safe-area-inset-bottom));
    left: 18px;
    width: auto;
  }

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    bottom: calc(84px + env(safe-area-inset-bottom));
  }
`;

const StepLabel = styled.p`
  margin: 0 0 2px;
  color: #ffd6dd;
  font-family: ${handwrittenFont};
  font-size: clamp(18px, 1.8vw, 24px);
  font-weight: 700;

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    font-size: 17px;
  }
`;

const Instruction = styled.h2`
  margin: 0;
  color: #ffffff;
  font-family: ${handwrittenFont};
  font-size: clamp(34px, 3.6vw, 50px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;

  @media (max-width: ${breakpoint.mobile}) {
    font-size: clamp(28px, 8vw, 37px);
  }

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    font-size: 25px;
  }
`;

const Description = styled.p`
  max-width: 570px;
  margin: 6px 0 0;
  color: rgb(255 255 255 / 86%);
  font-family: ${handwrittenFont};
  font-size: clamp(18px, 1.7vw, 23px);
  line-height: 1.25;

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    margin-top: 3px;
    font-size: 16px;
  }
`;

const TechnologyCard = styled.aside`
  max-width: 570px;
  margin-top: 10px;
  padding: 10px 13px;
  border: 1px solid rgb(255 255 255 / 34%);
  border-radius: 14px;
  background: rgb(36 33 34 / 32%);
  color: #ffffff;

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    margin-top: 6px;
    padding: 7px 10px;
  }
`;

const TechnologyTitle = styled.h3`
  margin: 0;
  font-family: ${handwrittenFont};
  font-size: clamp(18px, 1.6vw, 22px);
  line-height: 1.1;

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    font-size: 17px;
  }
`;

const TechnologyDescription = styled.p`
  margin: 3px 0 0;
  color: rgb(255 255 255 / 82%);
  font-family: ${handwrittenFont};
  font-size: clamp(15px, 1.25vw, 18px);
  line-height: 1.2;

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    font-size: 14px;
  }
`;

const TechnologyLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  margin-top: 3px;
  color: #fff4f6;
  font-size: 13px;
  font-weight: 800;
  text-underline-offset: 3px;

  &:hover {
    color: #ffffff;
  }

  &:focus-visible {
    border-radius: 4px;
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }

  @media (max-width: ${breakpoint.mobile}) {
    min-height: 36px;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 22px;

  @media (max-width: ${breakpoint.mobile}) {
    align-items: stretch;
    flex-direction: column;
    gap: 13px;
    margin-top: 17px;
  }

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    gap: 8px;
    margin-top: 10px;
  }
`;

const Progress = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: max-content;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
`;

const ProgressDots = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
`;

const ProgressDotButton = styled.button`
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgb(255 255 255 / 42%);
  cursor: pointer;
  transition:
    width 160ms ease,
    background 160ms ease;

  &[data-active='true'] {
    width: 22px;
    background: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 3px;
  }
`;

const ProgressNumber = styled.span`
  color: rgb(255 255 255 / 74%);
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  @media (max-width: ${breakpoint.mobile}) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
  }
`;

const BaseTextButton = styled.button`
  min-height: 46px;
  padding: 0 17px;
  border: 1px solid rgb(255 255 255 / 64%);
  border-radius: 999px;
  background: rgb(36 33 34 / 28%);
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;

  &:hover {
    background: rgb(255 255 255 / 15%);
  }

  &:focus-visible {
    outline: 3px solid #ffffff;
    outline-offset: 3px;
  }

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    min-height: 40px;
    font-size: 12px;
  }
`;

const SkipButton = styled(BaseTextButton)`
  @media (max-width: ${breakpoint.mobile}) {
    min-width: 0;
    padding: 0 12px;
  }
`;

const PreviousButton = styled(BaseTextButton)`
  @media (max-width: ${breakpoint.mobile}) {
    padding: 0 13px;
  }
`;

const NextButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 108px;
  min-height: 48px;
  padding: 0 20px;
  border: 0;
  border-radius: 999px;
  background: ${color.primary};
  box-shadow: ${shadow.card};
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;

  &:hover {
    background: ${color.primaryHover};
  }

  &:focus-visible {
    outline: 3px solid #ffffff;
    outline-offset: 3px;
  }

  @media (max-width: ${breakpoint.mobile}) {
    min-width: 92px;
    padding: 0 15px;
    font-size: 13px;
  }

  @media (max-width: ${breakpoint.mobile}) and (max-height: 720px) {
    min-height: 42px;
    font-size: 12px;
  }
`;

const CrayonArrow = styled.svg`
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  inset: 0;

  path {
    fill: none;
    stroke: #fffdf8;
    stroke-dasharray: 1 11;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 5;
  }

  .arrow-line {
    stroke-dasharray: 1 11;
  }

  .arrow-head {
    fill: #fffdf8;
    stroke: none;
    stroke-dasharray: none;
  }
`;
