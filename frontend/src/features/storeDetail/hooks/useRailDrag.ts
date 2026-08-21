import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

/** 이만큼 끌어야 다음 장으로 넘어간다. 그보다 짧으면 제자리로 돌아온다. */
const RAIL_SNAP_DISTANCE = 36;

interface RailDragStart {
  activeIndex: number;
  pointerId: number;
  scrollLeft: number;
  x: number;
}

function getFrameScrollLeft(frame: HTMLElement, rail: HTMLElement) {
  const firstFrame = rail.children.item(0) as HTMLElement | null;

  return frame.offsetLeft - (firstFrame?.offsetLeft ?? 0);
}

/**
 * 손가락으로 끌어 넘기는 가로 목록.
 *
 * 시트 자체가 위아래 드래그를 가로채기 때문에 브라우저 기본 스크롤에만
 * 맡길 수 없다. 포인터를 직접 받아 어느 장에 멈출지 정한다.
 *
 * 대표 사진과 가챠 사진이 같은 동작을 해야 해서 한 곳에 둔다.
 */
export function useRailDrag(itemCount: number) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<RailDragStart | null>(null);
  const dragDistanceRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const updateSlideControls = useCallback(() => {
    const rail = railRef.current;

    if (!rail) return;

    const frames = Array.from(rail.children) as HTMLElement[];
    const nextActiveIndex = frames.reduce((closestIndex, frame, index) => {
      const closestFrame = frames[closestIndex];

      if (!closestFrame) return index;

      return Math.abs(getFrameScrollLeft(frame, rail) - rail.scrollLeft) <
        Math.abs(getFrameScrollLeft(closestFrame, rail) - rail.scrollLeft)
        ? index
        : closestIndex;
    }, 0);

    setActiveIndex(nextActiveIndex);
  }, []);

  useEffect(() => {
    const rail = railRef.current;

    if (!rail) return;

    updateSlideControls();

    const resizeObserver = new ResizeObserver(updateSlideControls);

    resizeObserver.observe(rail);

    return () => resizeObserver.disconnect();
  }, [itemCount, updateSlideControls]);

  const scrollToIndex = useCallback(
    (rail: HTMLElement, index: number) => {
      const nextIndex = Math.min(Math.max(index, 0), itemCount - 1);
      const nextFrame = rail.children.item(nextIndex) as HTMLElement | null;

      if (!nextFrame) return;

      rail.scrollTo({
        behavior: 'smooth',
        left: getFrameScrollLeft(nextFrame, rail),
      });
    },
    [itemCount],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    // 레일이 포인터를 캡처하면 그 안의 버튼은 click 을 못 받는다.
    // 눌린 곳이 버튼이면 끌기를 시작하지 않는다.
    if ((event.target as HTMLElement).closest('button')) return;

    dragStartRef.current = {
      activeIndex,
      pointerId: event.pointerId,
      scrollLeft: event.currentTarget.scrollLeft,
      x: event.clientX,
    };
    dragDistanceRef.current = 0;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;

    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    const dragDistance = event.clientX - dragStart.x;

    dragDistanceRef.current = dragDistance;
    event.currentTarget.scrollLeft = dragStart.scrollLeft - dragDistance;

    if (Math.abs(dragDistance) > 4) event.preventDefault();
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;

    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    const direction =
      Math.abs(dragDistanceRef.current) < RAIL_SNAP_DISTANCE
        ? 0
        : dragDistanceRef.current > 0
          ? -1
          : 1;

    scrollToIndex(event.currentTarget, dragStart.activeIndex + direction);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
    dragDistanceRef.current = 0;
    setIsDragging(false);
  };

  return {
    activeIndex,
    isDragging,
    railProps: {
      onPointerCancel: finishDrag,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishDrag,
      onScroll: updateSlideControls,
    },
    railRef,
  };
}
