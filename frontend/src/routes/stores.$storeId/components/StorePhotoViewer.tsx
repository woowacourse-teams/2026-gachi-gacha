import { useCallback, useEffect, useRef, useState, type UIEvent } from 'react';
import { createPortal } from 'react-dom';

import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import {
  Backdrop,
  CloseButton,
  Counter,
  Dialog,
  DirectionButton,
  Photo,
  Rail,
  Slide,
  ThumbnailButton,
  ThumbnailList,
  ThumbnailPhoto,
  Title,
  TopBar,
  Viewer,
} from './StorePhotoViewer.styles';

export interface StorePhotoViewerProps {
  imageUrls: readonly string[];
  initialIndex: number;
  storeName: string;
  onClose: () => void;
}

export function StorePhotoViewer({
  imageUrls,
  initialIndex,
  storeName,
  onClose,
}: StorePhotoViewerProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbnailListRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const moveTo = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const rail = railRef.current;

      if (!rail || index < 0 || index >= imageUrls.length) {
        return;
      }

      rail.scrollTo({ left: rail.clientWidth * index, behavior });
      setActiveIndex(index);
    },
    [imageUrls.length],
  );

  useEffect(() => {
    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    window.requestAnimationFrame(() => moveTo(initialIndex, 'auto'));

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled)',
        );

      if (!focusableElements?.length) {
        return;
      }

      const firstElement = focusableElements.item(0);
      const lastElement = focusableElements.item(focusableElements.length - 1);

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [initialIndex, moveTo, onClose]);

  useEffect(() => {
    const activeThumbnail = thumbnailListRef.current?.children.item(
      activeIndex,
    ) as HTMLElement | null;

    activeThumbnail?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeIndex]);

  function updateActiveIndex(event: UIEvent<HTMLDivElement>) {
    const rail = event.currentTarget;

    if (rail.clientWidth === 0) {
      return;
    }

    const nextIndex = Math.round(rail.scrollLeft / rail.clientWidth);

    if (nextIndex >= 0 && nextIndex < imageUrls.length) {
      setActiveIndex(nextIndex);
    }
  }

  return createPortal(
    <Backdrop
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${storeName} 사진 전체 보기`}
      >
        <TopBar>
          <Title>{storeName}</Title>
          <Counter aria-live="polite">
            {activeIndex + 1} / {imageUrls.length}
          </Counter>
          <CloseButton
            ref={closeButtonRef}
            type="button"
            aria-label="사진 전체 보기 닫기"
            onClick={onClose}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5 15 15M15 5 5 15" />
            </svg>
          </CloseButton>
        </TopBar>

        <Viewer>
          <Rail ref={railRef} onScroll={updateActiveIndex}>
            {imageUrls.map((imageUrl, index) => (
              <Slide key={imageUrl}>
                <LogoImagePlaceholder />
                <Photo
                  src={imageUrl}
                  alt={`${storeName} 매장 사진 ${index + 1}`}
                  decoding="async"
                  draggable={false}
                />
              </Slide>
            ))}
          </Rail>

          <DirectionButton
            $direction="previous"
            type="button"
            aria-label="이전 사진"
            disabled={activeIndex === 0}
            onClick={() => moveTo(activeIndex - 1)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m12 5-5 5 5 5" />
            </svg>
          </DirectionButton>
          <DirectionButton
            $direction="next"
            type="button"
            aria-label="다음 사진"
            disabled={activeIndex === imageUrls.length - 1}
            onClick={() => moveTo(activeIndex + 1)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m8 5 5 5-5 5" />
            </svg>
          </DirectionButton>
        </Viewer>

        <ThumbnailList ref={thumbnailListRef} aria-label="매장 사진 목록">
          {imageUrls.map((imageUrl, index) => (
            <ThumbnailButton
              key={imageUrl}
              $isActive={activeIndex === index}
              type="button"
              aria-label={`${index + 1}번째 사진 보기`}
              aria-current={activeIndex === index ? 'true' : undefined}
              onClick={() => moveTo(index)}
            >
              <LogoImagePlaceholder />
              <ThumbnailPhoto
                src={imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </ThumbnailButton>
          ))}
        </ThumbnailList>
      </Dialog>
    </Backdrop>,
    document.body,
  );
}
