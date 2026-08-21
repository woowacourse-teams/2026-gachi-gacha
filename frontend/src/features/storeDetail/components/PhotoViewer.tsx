import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';

import * as S from './PhotoViewer.styles';
import { useBackClose } from '../hooks/useBackClose';
import { useRailDrag } from '../hooks/useRailDrag';

interface PhotoViewerProps {
  imageUrls: string[];
  /** 어느 장에서 열렸는지. 누른 사진이 먼저 보여야 한다. */
  startIndex: number;
  title: string;
  onClose: () => void;
}

/**
 * 사진을 화면 가득 보는 층.
 *
 * 시트 위가 아니라 문서 맨 위에 붙는다. `SheetRoot` 가 `overflow: hidden` 이라
 * 그 안에서는 시트 밖으로 나갈 수 없다.
 *
 * 시트는 닫지 않는다. 뷰어를 닫으면 보던 자리로 그대로 돌아와야 한다.
 */
export default function PhotoViewer({
  imageUrls,
  startIndex,
  title,
  onClose,
}: PhotoViewerProps) {
  const { activeIndex, isDragging, railProps, railRef, scrollToIndex } =
    useRailDrag(imageUrls.length);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const hasScrolledStripRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);

  // 닫는 길은 하나뿐이다. 버튼도 뒤로가기를 부르고 실제로 닫는 건 useBackClose 가 한다.
  const requestClose = () => history.back();

  useBackClose(true, onClose);

  useEffect(() => {
    // 열자마자 누른 장으로 보낸다. 애니메이션 없이 한 번에.
    const rail = railRef.current;

    if (!rail || hasStarted) return;

    scrollToIndex(startIndex, 'auto');
    setHasStarted(true);
    closeButtonRef.current?.focus();
  }, [hasStarted, railRef, scrollToIndex, startIndex]);

  useEffect(() => {
    // 사진을 넘기면 아래 줄도 따라온다. 30번째를 보는데 줄은 첫 장에 머물러
    // 있으면 지금 어디쯤인지 줄에서 확인할 수가 없다.
    //
    // 보고 있는 장을 줄의 맨 왼쪽에 둔다. 그러면 오른쪽이 전부 앞으로 볼
    // 사진이라 다음에 무엇이 오는지 한눈에 들어온다.
    //
    // scrollIntoView 는 조상까지 스크롤할 수 있어 직접 계산한다.
    const strip = stripRef.current;
    const item = strip?.children.item(activeIndex) as HTMLElement | null;
    const firstItem = strip?.children.item(0) as HTMLElement | null;

    if (!strip || !item || !firstItem) return;

    // 첫 칸이 놓인 자리만큼 빼면 좌우 여백이 첫 장일 때와 같아진다.
    const alignedToLeft = item.offsetLeft - firstItem.offsetLeft;
    const isFirstRender = !hasScrolledStripRef.current;

    hasScrolledStripRef.current = true;
    strip.scrollTo({
      behavior: isFirstRender ? 'auto' : 'smooth',
      left: alignedToLeft,
    });
  }, [activeIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    // 뷰어가 떠 있는 동안 뒤 화면이 따라 움직이면 어지럽다.
    const { overflow } = document.body.style;

    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, []);

  /**
   * React 는 포털 안의 이벤트를 DOM 이 아니라 React 트리를 따라 올린다.
   * 뷰어가 body 에 붙어 있어도 클릭과 포인터가 시트의 드래그 핸들러로 들어가,
   * 아래 썸네일을 누르면 시트가 끌려 내려가 닫혀버린다.
   */
  const stopBubbling = (event: SyntheticEvent) => event.stopPropagation();

  return createPortal(
    <S.Backdrop
      aria-label={title}
      aria-modal="true"
      role="dialog"
      onClick={stopBubbling}
      onPointerCancel={stopBubbling}
      onPointerDown={stopBubbling}
      onPointerMove={stopBubbling}
      onPointerUp={stopBubbling}
    >
      <S.Frame>
        <S.TopBar>
          <S.CloseButton
            ref={closeButtonRef}
            aria-label="사진 닫기"
            type="button"
            onClick={requestClose}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="M5 5 15 15M15 5 5 15" />
            </svg>
          </S.CloseButton>
        </S.TopBar>

        <S.Rail
          ref={railRef}
          $isDragging={isDragging}
          aria-label={title}
          data-horizontal-scroll
          {...railProps}
        >
          {imageUrls.map((imageUrl, index) => (
            <S.Slide key={imageUrl}>
              <S.Photo
                alt={`${title} ${index + 1}`}
                draggable={false}
                src={imageUrl}
              />
            </S.Slide>
          ))}
        </S.Rail>

        {imageUrls.length > 1 && (
          <>
            <S.Counter aria-live="polite">
              {activeIndex + 1} / {imageUrls.length}
            </S.Counter>
            <S.Strip ref={stripRef} aria-label={`${title} 목록`}>
              {imageUrls.map((imageUrl, index) => (
                <S.StripItem
                  key={imageUrl}
                  $isActive={index === activeIndex}
                  aria-current={index === activeIndex}
                  aria-label={`${index + 1}번째 사진 보기`}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                >
                  <img alt="" src={imageUrl} />
                </S.StripItem>
              ))}
            </S.Strip>
          </>
        )}
      </S.Frame>
    </S.Backdrop>,
    document.body,
  );
}
