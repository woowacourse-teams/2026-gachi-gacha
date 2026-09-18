import { useEffect, useRef } from 'react';

import { Icon } from './Icon';

export function InfoDialog({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
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
      className="promo-dialog"
      aria-labelledby="promo-dialog-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="promo-dialog-content">
        <button
          className="promo-icon-button promo-dialog-close"
          aria-label="안내 닫기"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        <div className="promo-dialog-symbol">
          <Icon name="sparkle" size={30} />
        </div>
        <h2 id="promo-dialog-title">{title}</h2>
        <p>{message}</p>
        <p className="promo-muted">
          가치가챠는 지금 새로운 서비스를 준비하고 있어요.
        </p>
        <button className="promo-button" onClick={onClose}>
          알겠어요
        </button>
      </div>
    </dialog>
  );
}
