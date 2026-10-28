import {
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

const DRAG_START_THRESHOLD_PX = 4;

interface DragState {
  pointerId: number;
  startClientX: number;
  startScrollLeft: number;
  hasDragged: boolean;
}

export function useMouseDragScroll() {
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(
    () => () => {
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    },
    [],
  );

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      hasDragged: false,
    };
    suppressClickRef.current = false;
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (
      dragState === null ||
      dragState.pointerId !== event.pointerId ||
      event.pointerType !== 'mouse'
    ) {
      return;
    }

    const distance = event.clientX - dragState.startClientX;

    if (!dragState.hasDragged && Math.abs(distance) < DRAG_START_THRESHOLD_PX) {
      return;
    }

    if (!dragState.hasDragged) {
      dragState.hasDragged = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setIsDragging(true);
    }

    event.preventDefault();
    event.currentTarget.scrollLeft = dragState.startScrollLeft - distance;
  }

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (dragState === null || dragState.pointerId !== event.pointerId) return;

    if (
      event.currentTarget.hasPointerCapture?.(event.pointerId) &&
      event.currentTarget.releasePointerCapture
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (dragState.hasDragged) {
      suppressClickRef.current = true;
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        suppressClickTimerRef.current = null;
      });
    }

    dragStateRef.current = null;
    setIsDragging(false);
  }

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  return {
    isDragging,
    dragHandlers: {
      onClickCapture: handleClickCapture,
      onDragStart: (event: ReactDragEvent<HTMLDivElement>) =>
        event.preventDefault(),
      onPointerCancel: finishDrag,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishDrag,
    },
  };
}
