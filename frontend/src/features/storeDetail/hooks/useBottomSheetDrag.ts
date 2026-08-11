import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import {
  getBottomSheetStateLabel,
  getCollapsedBottomSheetState,
  getExpandedBottomSheetState,
} from '../model/bottomSheetState';
import type { BottomSheetState } from '../model/storeDetail';

interface UseBottomSheetDragParams {
  state: BottomSheetState;
  onStateChange: (state: BottomSheetState) => void;
}

interface DragStart {
  pointerId: number;
  scrollElement: HTMLElement | null;
  scrollTop: number;
  y: number;
}

const DRAG_THRESHOLD = 56;
const MAX_DRAG_OFFSET = 140;

function clampDragOffset(state: BottomSheetState, offset: number) {
  if (state === 'full') return Math.min(Math.max(offset, 0), MAX_DRAG_OFFSET);

  return Math.min(Math.max(offset, -MAX_DRAG_OFFSET), MAX_DRAG_OFFSET);
}

function findScrollElement(target: EventTarget, sheetElement: HTMLElement) {
  const targetScrollElement =
    target instanceof Element
      ? target.closest<HTMLElement>('[data-sheet-scroll]')
      : null;

  return (
    targetScrollElement ??
    sheetElement.querySelector<HTMLElement>('[data-sheet-scroll]')
  );
}

export function useBottomSheetDrag({
  state,
  onStateChange,
}: UseBottomSheetDragParams) {
  const dragStartRef = useRef<DragStart | null>(null);
  const dragOffsetRef = useRef(0);
  const didDragRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const updateDragOffset = (offset: number) => {
    const nextOffset = clampDragOffset(state, offset);

    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const resetDrag = () => {
    dragStartRef.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (state === 'closed') return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const scrollElement = findScrollElement(event.target, event.currentTarget);

    dragStartRef.current = {
      pointerId: event.pointerId,
      scrollElement,
      scrollTop: scrollElement?.scrollTop ?? 0,
      y: event.clientY,
    };
    didDragRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const dragStart = dragStartRef.current;

    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    const offset = event.clientY - dragStart.y;

    if (Math.abs(offset) > 4) {
      if (!didDragRef.current) {
        didDragRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      event.preventDefault();
    }

    if (state === 'full' && dragStart.scrollElement) {
      const nextScrollTop = dragStart.scrollTop - offset;

      dragStart.scrollElement.scrollTop = Math.max(0, nextScrollTop);
      updateDragOffset(Math.max(0, offset - dragStart.scrollTop));
      return;
    }

    updateDragOffset(offset);
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLElement>) => {
    const dragStart = dragStartRef.current;

    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    const offset = event.clientY - dragStart.y;
    const stateOffset = state === 'full' ? dragOffsetRef.current : offset;

    if (stateOffset >= DRAG_THRESHOLD) {
      onStateChange(getCollapsedBottomSheetState(state));
    }

    if (stateOffset <= -DRAG_THRESHOLD) {
      onStateChange(getExpandedBottomSheetState(state));
    }

    resetDrag();
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const handlePointerCancel = () => {
    didDragRef.current = false;
    resetDrag();
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    if (!didDragRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  };

  const handleClick = () => {
    onStateChange(getExpandedBottomSheetState(state));
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onStateChange(getExpandedBottomSheetState(state));
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onStateChange(getCollapsedBottomSheetState(state));
    }
  };

  return {
    dragOffset,
    isDragging,
    handleProps: {
      'aria-label': `바텀시트 크기 조절, 현재 ${getBottomSheetStateLabel(state)}`,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    sheetProps: {
      onClickCapture: handleClickCapture,
      onPointerCancel: handlePointerCancel,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
    },
  };
}
