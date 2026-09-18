import { useEffect, useRef } from 'react';

import { Icon } from './Icon';

export function ImageViewer({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="promo-image-viewer"
      aria-label={title + ' 이미지 확대'}
      onClose={onClose}
      onCancel={onClose}
    >
      <button
        className="promo-icon-button"
        aria-label="이미지 확대 닫기"
        onClick={onClose}
      >
        <Icon name="close" />
      </button>
      <img src={src} alt={title} />
    </dialog>
  );
}
