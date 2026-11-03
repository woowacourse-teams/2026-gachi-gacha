/** One system Back press may close a web overlay OR navigate, never both. */
export function createWebShellBackController({
  dispatch,
  onUnhandled,
  onUnresponsive,
}: {
  dispatch: (requestId: number, expiresAt: number) => boolean;
  onUnhandled: () => void;
  onUnresponsive?: () => void;
}) {
  let nextRequestId = 0;
  let pending: { id: number; timer: ReturnType<typeof setTimeout> } | null = null;

  function cancel() {
    if (pending) clearTimeout(pending.timer);
    pending = null;
  }

  function resolve(requestId: number, handled: boolean) {
    if (pending?.id !== requestId) return;
    cancel();
    if (!handled) onUnhandled();
  }

  return {
    cancel,
    resolve,
    press() {
      if (pending) return;
      const id = ++nextRequestId;
      // Silence is NOT proof that no overlay was closed: its ACK may be late.
      // Release the in-flight guard without navigating twice. Unavailable views
      // still use the immediate native fallback through dispatch(false).
      pending = {
        id,
        timer: setTimeout(() => {
          cancel();
          onUnresponsive?.();
        }, 500),
      };
      try {
        if (!dispatch(id, Date.now() + 500)) resolve(id, false);
      } catch {
        resolve(id, false);
      }
    },
  };
}
