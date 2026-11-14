import {
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';

import {
  IMAGE_TOO_LARGE_MESSAGE,
  TRADE_IMAGE_ACCEPT,
  UNSUPPORTED_IMAGE_TYPE_MESSAGE,
  validateTradeImage,
} from '@/domains/trade/tradeImagePolicy';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

const MAX_PHOTO_COUNT = 5;
const POINTER_DRAG_THRESHOLD_PX = 8;
const INTERNAL_PHOTO_MIME_TYPE = 'application/x-gachi-trade-photo-index';

type PhotoInputSource = 'file_picker' | 'drop' | 'paste';

interface PointerDragState {
  pointerId: number;
  sourceIndex: number;
  targetIndex: number;
  startX: number;
  startY: number;
  isDragging: boolean;
}

const PASTED_IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function hasFileType(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes('Files');
}

function isExternalImageDrag(dataTransfer: DataTransfer): boolean {
  if (
    Array.from(dataTransfer.types).includes(INTERNAL_PHOTO_MIME_TYPE) ||
    !hasFileType(dataTransfer)
  ) {
    return false;
  }

  const items = Array.from(dataTransfer.items);

  return (
    items.length === 0 ||
    items.some(
      (item) =>
        item.kind === 'file' &&
        (item.type === '' || item.type.startsWith('image/')),
    )
  );
}

function normalizePastedFile(file: File, index: number): File {
  if (/\.[a-z0-9]+$/i.test(file.name)) {
    return file;
  }

  const extension = PASTED_IMAGE_EXTENSIONS[file.type.toLowerCase()];

  if (!extension) {
    return file;
  }

  return new File(
    [file],
    `pasted-image-${Date.now()}-${index + 1}.${extension}`,
    {
      type: file.type,
      lastModified: file.lastModified,
    },
  );
}

interface PhotoUploaderProps {
  files: File[];
  initialImageUrls?: string[];
  onFilesChange: (files: File[]) => void;
  errorMessage?: string | undefined;
}

export default function PhotoUploader({
  files,
  initialImageUrls = [],
  onFilesChange,
  errorMessage,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const externalDragDepthRef = useRef(0);
  const pointerDragRef = useRef<PointerDragState | null>(null);
  const fileIdsRef = useRef(new WeakMap<File, string>());
  const nextFileIdRef = useRef(0);
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  const [isExternalDragActive, setIsExternalDragActive] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [selectionErrorMessage, setSelectionErrorMessage] = useState<
    string | null
  >(null);
  const visibleErrorMessage = selectionErrorMessage ?? errorMessage;
  // 새 사진을 하나라도 고르면 기존 사진은 전부 교체되므로 화면에서도 숨긴다.
  const visibleInitialImageUrls = files.length > 0 ? [] : initialImageUrls;
  const photoCount = visibleInitialImageUrls.length + files.length;

  useEffect(() => {
    return () => {
      previewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [previewUrls]);

  const addFiles = useCallback(
    (selectedFiles: File[], source: PhotoInputSource) => {
      const rejections = selectedFiles.map(validateTradeImage);
      const acceptedFiles = selectedFiles.filter(
        (_, index) => rejections[index] === null,
      );
      const availableCount = MAX_PHOTO_COUNT - files.length;
      const nextFiles = acceptedFiles.slice(0, availableCount);

      // 형식 오류를 용량 오류보다 먼저 안내한다.
      setSelectionErrorMessage(
        rejections.includes('unsupported-type')
          ? UNSUPPORTED_IMAGE_TYPE_MESSAGE
          : rejections.includes('too-large')
            ? IMAGE_TOO_LARGE_MESSAGE
            : null,
      );

      if (nextFiles.length > 0) {
        onFilesChange([...files, ...nextFiles]);
        setAnnouncement(
          `사진 ${nextFiles.length}장을 ${
            source === 'paste'
              ? '붙여넣었어요.'
              : source === 'drop'
                ? '추가했어요.'
                : '선택했어요.'
          }`,
        );
      }

      captureAnalyticsEvent('trade_photo_selection_completed', {
        source,
        accepted_count: nextFiles.length,
        rejected_count: rejections.filter(Boolean).length,
        total_count: files.length + nextFiles.length,
      });
    },
    [files, onFilesChange],
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData;
      const clipboardFiles = Array.from(clipboardData?.files ?? []);
      const itemFiles = Array.from(clipboardData?.items ?? []).flatMap(
        (item) => {
          if (item.kind !== 'file') {
            return [];
          }

          const file = item.getAsFile();

          return file ? [file] : [];
        },
      );
      const pastedImages = (
        clipboardFiles.length > 0 ? clipboardFiles : itemFiles
      )
        .filter((file) => file.type.startsWith('image/'))
        .map(normalizePastedFile);

      if (pastedImages.length === 0) {
        return;
      }

      event.preventDefault();
      addFiles(pastedImages, 'paste');
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [addFiles]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []), 'file_picker');

    event.target.value = '';
  };

  const handleRemove = (targetIndex: number) => {
    onFilesChange(files.filter((_, index) => index !== targetIndex));
  };

  const getFileId = (file: File): string => {
    const storedId = fileIdsRef.current.get(file);

    if (storedId) {
      return storedId;
    }

    const nextId = `trade-photo-${nextFileIdRef.current}`;
    nextFileIdRef.current += 1;
    fileIdsRef.current.set(file, nextId);

    return nextId;
  };

  const reorderFiles = (
    sourceIndex: number,
    targetIndex: number,
    method: 'drag' | 'keyboard',
  ) => {
    if (
      sourceIndex === targetIndex ||
      sourceIndex < 0 ||
      targetIndex < 0 ||
      sourceIndex >= files.length ||
      targetIndex >= files.length
    ) {
      return;
    }

    const nextFiles = [...files];
    const [movedFile] = nextFiles.splice(sourceIndex, 1);

    if (!movedFile) {
      return;
    }

    nextFiles.splice(targetIndex, 0, movedFile);
    onFilesChange(nextFiles);
    setAnnouncement(
      `${movedFile.name} 사진을 ${targetIndex + 1}번째로 이동했어요.`,
    );
    captureAnalyticsEvent('trade_photo_reordered', {
      method,
      from_index: sourceIndex,
      to_index: targetIndex,
      total_count: files.length,
    });
  };

  const resetInternalDrag = () => {
    setDraggingIndex(null);
    setDropTargetIndex(null);
  };

  const handlePhotoDragStart = (
    event: DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (event.target instanceof HTMLElement && event.target.closest('button')) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(INTERNAL_PHOTO_MIME_TYPE, String(index));
    event.dataTransfer.setData('text/plain', String(index));
    setDraggingIndex(index);
    setDropTargetIndex(index);
  };

  const handlePhotoDragOver = (
    event: DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (
      !Array.from(event.dataTransfer.types).includes(INTERNAL_PHOTO_MIME_TYPE)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  const handlePhotoDrop = (
    event: DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    const sourceIndex = Number(
      event.dataTransfer.getData(INTERNAL_PHOTO_MIME_TYPE),
    );

    if (!Number.isInteger(sourceIndex)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    reorderFiles(sourceIndex, targetIndex, 'drag');
    resetInternalDrag();
  };

  const handlePhotoKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    sourceIndex: number,
  ) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    const targetIndex =
      event.key === 'ArrowLeft' ? sourceIndex - 1 : sourceIndex + 1;
    reorderFiles(sourceIndex, targetIndex, 'keyboard');
  };

  const handlePhotoPointerDown = (
    event: PointerEvent<HTMLDivElement>,
    sourceIndex: number,
  ) => {
    if (
      (event.pointerType !== 'touch' && event.pointerType !== 'pen') ||
      !event.isPrimary ||
      files.length < 2 ||
      (event.target instanceof HTMLElement && event.target.closest('button'))
    ) {
      return;
    }

    pointerDragRef.current = {
      pointerId: event.pointerId,
      sourceIndex,
      targetIndex: sourceIndex,
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false,
    };
  };

  const handlePhotoPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointerDrag = pointerDragRef.current;

    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) {
      return;
    }

    const horizontalDistance = Math.abs(event.clientX - pointerDrag.startX);
    const verticalDistance = Math.abs(event.clientY - pointerDrag.startY);

    if (!pointerDrag.isDragging) {
      if (
        Math.max(horizontalDistance, verticalDistance) <
        POINTER_DRAG_THRESHOLD_PX
      ) {
        return;
      }

      if (verticalDistance > horizontalDistance) {
        pointerDragRef.current = null;
        return;
      }

      pointerDrag.isDragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraggingIndex(pointerDrag.sourceIndex);
      setDropTargetIndex(pointerDrag.sourceIndex);
    }

    event.preventDefault();
    const elementAtPointer = document.elementFromPoint(
      event.clientX,
      event.clientY,
    );
    const targetPhoto = elementAtPointer?.closest<HTMLElement>(
      '[data-trade-photo-index]',
    );
    const targetIndex = Number(targetPhoto?.dataset.tradePhotoIndex);

    if (
      Number.isInteger(targetIndex) &&
      targetIndex >= 0 &&
      targetIndex < files.length
    ) {
      pointerDrag.targetIndex = targetIndex;
      setDropTargetIndex(targetIndex);
    }
  };

  const finishPhotoPointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const pointerDrag = pointerDragRef.current;

    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) {
      return;
    }

    if (pointerDrag.isDragging) {
      event.preventDefault();
      reorderFiles(pointerDrag.sourceIndex, pointerDrag.targetIndex, 'drag');
    }

    pointerDragRef.current = null;
    resetInternalDrag();
  };

  const cancelPhotoPointerDrag = () => {
    pointerDragRef.current = null;
    resetInternalDrag();
  };

  const handleExternalDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalImageDrag(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    externalDragDepthRef.current += 1;
    setIsExternalDragActive(true);
  };

  const handleExternalDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalImageDrag(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleExternalDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalImageDrag(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    externalDragDepthRef.current = Math.max(
      0,
      externalDragDepthRef.current - 1,
    );

    if (externalDragDepthRef.current === 0) {
      setIsExternalDragActive(false);
    }
  };

  const handleExternalDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalImageDrag(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    externalDragDepthRef.current = 0;
    setIsExternalDragActive(false);
    addFiles(Array.from(event.dataTransfer.files), 'drop');
  };

  return (
    <Wrapper role="group" aria-labelledby="trade-photo-label" aria-required>
      <Label id="trade-photo-label">
        사진 <RequiredMark aria-hidden="true">*</RequiredMark>{' '}
        <Count>
          ({photoCount}/{MAX_PHOTO_COUNT})
        </Count>
      </Label>
      {initialImageUrls.length > 0 && (
        <Hint>새 사진을 추가하면 기존 사진은 모두 교체돼요.</Hint>
      )}

      <DropZone
        data-testid="trade-photo-drop-zone"
        onDragEnter={handleExternalDragEnter}
        onDragOver={handleExternalDragOver}
        onDragLeave={handleExternalDragLeave}
        onDrop={handleExternalDrop}
      >
        <PhotoList role="list" aria-label="등록할 거래 사진">
          {files.length < MAX_PHOTO_COUNT && (
            <AddSlot role="listitem">
              <AddButton
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                <CameraIcon aria-hidden="true" />
                <span>사진 추가</span>
              </AddButton>
            </AddSlot>
          )}

          {visibleInitialImageUrls.map((url, index) => (
            <PreviewItem key={url} role="listitem">
              <PreviewImage src={url} alt={`기존 거래 사진 ${index + 1}`} />
            </PreviewItem>
          ))}

          {previewUrls.map((url, index) => (
            <PreviewItem
              key={getFileId(files[index] as File)}
              data-trade-photo-index={index}
              role="listitem"
              aria-label={`거래 사진 ${index + 1}. 좌우 방향키 또는 드래그로 순서를 변경할 수 있어요.`}
              aria-keyshortcuts="ArrowLeft ArrowRight"
              tabIndex={files.length > 1 ? 0 : -1}
              draggable={files.length > 1}
              $isReorderable={files.length > 1}
              $isDragging={draggingIndex === index}
              $isDropTarget={
                draggingIndex !== null &&
                dropTargetIndex === index &&
                draggingIndex !== index
              }
              onDragStart={(event) => handlePhotoDragStart(event, index)}
              onDragOver={(event) => handlePhotoDragOver(event, index)}
              onDrop={(event) => handlePhotoDrop(event, index)}
              onDragEnd={resetInternalDrag}
              onKeyDown={(event) => handlePhotoKeyDown(event, index)}
              onPointerDown={(event) => handlePhotoPointerDown(event, index)}
              onPointerMove={handlePhotoPointerMove}
              onPointerUp={finishPhotoPointerDrag}
              onPointerCancel={cancelPhotoPointerDrag}
            >
              <PreviewImage
                src={url}
                alt={`거래 사진 ${index + 1}`}
                draggable={false}
              />
              <RemoveButton
                type="button"
                aria-label={`거래 사진 ${index + 1} 삭제`}
                onClick={() => handleRemove(index)}
              >
                ×
              </RemoveButton>
            </PreviewItem>
          ))}
        </PhotoList>
        {isExternalDragActive && (
          <DropOverlay role="status">사진을 여기에 놓아주세요</DropOverlay>
        )}
      </DropZone>

      <HiddenInput
        ref={inputRef}
        type="file"
        accept={TRADE_IMAGE_ACCEPT}
        multiple
        onChange={handleChange}
      />
      {visibleErrorMessage && (
        <ErrorMessage role="alert">{visibleErrorMessage}</ErrorMessage>
      )}
      <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
    </Wrapper>
  );
}

function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" {...props}>
      <path
        d="M8.5 6 10 4h4l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12.5"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.p`
  margin: 0;
  color: #242429;
  font-size: 15px;
  font-weight: 800;
`;

const Hint = styled.p`
  margin: -4px 0 0;
  color: #858790;
  font-size: 13px;
`;

const Count = styled.span`
  color: #92949c;
  font-weight: 500;
`;

const RequiredMark = styled.span`
  color: #ed174c;
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: #d80f42;
  font-size: 13px;
`;

const PhotoList = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
`;

const DropZone = styled.div`
  position: relative;
  min-height: 144px;
  border-radius: 14px;
`;

const DropOverlay = styled.div`
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  min-width: 100%;
  place-items: center;
  border: 2px dashed rgb(255 255 255 / 88%);
  border-radius: 14px;
  background: rgb(36 36 41 / 66%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  pointer-events: none;
`;

const photoBoxStyle = css`
  box-sizing: border-box;
  width: 144px;
  aspect-ratio: 1 / 1;
  flex: 0 0 auto;
  border-radius: 14px;
`;

const AddSlot = styled.div`
  ${photoBoxStyle};
`;

const AddButton = styled.button`
  ${photoBoxStyle};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #e2e2e5;
  background: #fafafa;
  color: #7f8189;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const PreviewItem = styled.div<{
  $isReorderable?: boolean;
  $isDragging?: boolean;
  $isDropTarget?: boolean;
}>`
  ${photoBoxStyle};
  position: relative;
  overflow: hidden;
  opacity: ${({ $isDragging }) => ($isDragging ? 0.48 : 1)};
  outline: ${({ $isDropTarget }) =>
    $isDropTarget ? '3px solid #ed174c' : 'none'};
  outline-offset: -3px;
  cursor: ${({ $isReorderable }) => ($isReorderable ? 'grab' : 'default')};
  touch-action: ${({ $isReorderable }) => ($isReorderable ? 'pan-y' : 'auto')};
  transition:
    opacity 120ms ease,
    outline-color 120ms ease;

  &:active {
    cursor: ${({ $isReorderable }) =>
      $isReorderable ? 'grabbing' : 'default'};
  }

  &:focus-visible {
    outline: 3px solid #ed174c;
    outline-offset: 2px;
  }
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  width: 26px;
  height: 26px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgb(24 24 27 / 72%);
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
`;

const HiddenInput = styled.input`
  display: none;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  margin: -1px;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;
