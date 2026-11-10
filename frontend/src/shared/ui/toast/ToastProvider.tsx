import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from '@emotion/styled';

import { focusRing, zIndex } from '@/shared/styles/tokens';

export interface ToastOptions {
  message: string;
  /** 눌렀던 동작을 다시 할 수 있을 때 (예: 다시 시도) */
  action?: { label: string; onClick: () => void } | undefined;
  /** 오류는 화면 읽기 프로그램에 바로 알린다 */
  tone?: 'info' | 'error';
  durationMs?: number;
}

interface ToastState extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const DEFAULT_DURATION_MS = 3500;
const ACTION_DURATION_MS = 6000;

const ToastContext = createContext<ToastContextValue | null>(null);

/** Pen `App/Toast`: 눌렀던 동작 하나가 실패했을 때 화면은 그대로 두고 아래에 잠깐 알린다. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);

  const hideToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((options: ToastOptions) => {
    idRef.current += 1;
    setToast({ ...options, id: idRef.current });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(
      () => setToast((current) => (current?.id === toast.id ? null : current)),
      toast.durationMs ??
        (toast.action ? ACTION_DURATION_MS : DEFAULT_DURATION_MS),
    );

    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({ showToast, hideToast }),
    [hideToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Region
        role={toast?.tone === 'error' ? 'alert' : 'status'}
        aria-live={toast?.tone === 'error' ? 'assertive' : 'polite'}
      >
        {toast && (
          <Toast key={toast.id} data-testid="toast">
            <Message>{toast.message}</Message>
            {toast.action && (
              <Action
                type="button"
                onClick={() => {
                  setToast(null);
                  toast.action?.onClick();
                }}
              >
                {toast.action.label}
              </Action>
            )}
          </Toast>
        )}
      </Region>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast는 ToastProvider 안에서 사용해야 합니다.');
  }

  return context;
}

const Region = styled.div`
  position: fixed;
  z-index: ${zIndex.overlay};
  right: 0;
  /* 하단 탭·등록 버튼 같은 하단 고정 바(최대 약 80px) 위에 띄운다 */
  bottom: calc(96px + env(safe-area-inset-bottom));
  left: 0;
  display: flex;
  justify-content: center;
  padding: 0 16px;
  pointer-events: none;
`;

const Toast = styled.div`
  display: flex;
  width: min(100%, 420px);
  min-height: 52px;
  padding: 8px 16px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 14px;
  background: rgb(36 33 34 / 95%);
  box-shadow: 0 8px 24px rgb(36 33 34 / 18%);
  box-sizing: border-box;
  pointer-events: auto;
  animation: toast-in 180ms ease-out;

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Message = styled.p`
  min-width: 0;
  margin: 0;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
  white-space: pre-line;
  word-break: keep-all;
`;

const Action = styled.button`
  flex: 0 0 auto;
  padding: 6px 2px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #ffb4c0;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;
