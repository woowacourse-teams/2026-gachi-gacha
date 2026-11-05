/** Android already places the WebView inside the native bottom safe area. */
export const ANDROID_TRADE_FORM_STYLES = `
  @media (max-width: 767px) {
    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-trade-action-bar] {
      box-sizing: border-box !important;
      padding: 24px !important;
      background: #ffffff !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-trade-photos] {
      gap: 8px !important;
      align-items: stretch !important;
      overflow-x: auto !important;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-trade-photos] > [role="listitem"] {
      box-sizing: border-box !important;
      width: clamp(88px, calc((100% - 16px) / 3), 144px) !important;
      flex: 0 0 clamp(88px, calc((100% - 16px) / 3), 144px) !important;
      aspect-ratio: auto !important;
      touch-action: auto !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-trade-photos] > [role="listitem"] > img {
      display: block !important;
      width: 100% !important;
      height: auto !important;
      aspect-ratio: 1 / 1;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-trade-photos] > [role="listitem"]:not([data-trade-photo-index]) > button {
      width: 100% !important;
      height: 100% !important;
      min-height: 88px;
      aspect-ratio: auto !important;
      font-size: 12px !important;
    }

    html[data-gachigacha-native-platform="android"] [data-gachigacha-android-photo-handle] {
      box-sizing: border-box;
      display: flex;
      min-height: 44px;
      padding: 4px;
      align-items: center;
      justify-content: center;
      border-top: 1px solid #e9e9ec;
      background: #f7f7f8;
      color: #4c4d55;
      font-size: 12px;
      line-height: 1.25;
      font-weight: 600;
      touch-action: pan-y;
      user-select: none;
      cursor: grab;
    }
  }
`;

/** Match the web's form contract; never change an unrelated site footer. */
export function createWebShellTradeFormPresentationScript(): string {
  return `
    const tradePhotoMarker = 'data-gachigacha-android-trade-photos';
    const tradeHandleMarker = 'data-gachigacha-android-photo-handle';
    const currentTradeForm = () => {
      const path = window.location.pathname.replace(/\\/+$/, '');
      const formId = path === '/trade/new'
        ? 'trade-create-form'
        : /^\\/trade\\/\\d+\\/edit$/.test(path) ? 'trade-edit-form' : null;
      return formId ? document.getElementById(formId) : null;
    };

    if (!window.__gachigachaAndroidTradePhotoGestures) {
      document.addEventListener('pointerdown', (event) => {
        if (
          (event.pointerType !== 'touch' && event.pointerType !== 'pen') ||
          !event.isPrimary || !window.matchMedia('(max-width: 767px)').matches ||
          !(event.target instanceof Element)
        ) return;
        const target = event.target;
        const photo = target.closest('[data-trade-photo-index]');
        const list = photo?.parentElement;
        const form = currentTradeForm();
        if (
          !list?.hasAttribute(tradePhotoMarker) || !form?.contains(list) ||
          target.closest('button, [' + tradeHandleMarker + ']')
        ) return;

        // Capture before React's delegated pointerdown. Without a drag start,
        // the existing web reorder handlers remain idle and Chromium owns
        // native horizontal/vertical scrolling, including momentum. Never
        // cancel the default action or swallow pointercancel/up cleanup.
        event.stopPropagation();
      }, true);
      window.__gachigachaAndroidTradePhotoGestures = true;
    }

    const markTradeFormPresentation = () => {
      const form = currentTradeForm();
      const submit = form
        ? document.querySelector('button[type="submit"][form="' + form.id + '"]')
        : null;
      const actionBar = submit?.closest('footer');
      const marker = 'data-gachigacha-android-trade-action-bar';
      document.querySelectorAll('[' + marker + ']').forEach((element) => {
        if (element !== actionBar) element.removeAttribute(marker);
      });
      actionBar?.setAttribute(marker, '');

      const list = window.matchMedia('(max-width: 767px)').matches
        ? form?.querySelector('[role="list"][aria-label="등록할 거래 사진"]')
        : null;
      document.querySelectorAll('[' + tradePhotoMarker + ']').forEach((element) => {
        if (element !== list) element.removeAttribute(tradePhotoMarker);
      });
      list?.setAttribute(tradePhotoMarker, '');

      // React still owns all Files, ordering, images, delete buttons and
      // announcements. Only this adapter-owned visual grip is added/removed.
      const photos = Array.from(list?.querySelectorAll('[data-trade-photo-index]') || []);
      const reorderable = photos.filter((photo) => photos.length > 1 && photo.draggable);
      document.querySelectorAll('[' + tradeHandleMarker + ']').forEach((handle) => {
        if (!reorderable.includes(handle.parentElement)) handle.remove();
      });
      reorderable.forEach((photo) => {
        if (photo.querySelector('[' + tradeHandleMarker + ']')) return;
        const handle = document.createElement('div');
        handle.setAttribute(tradeHandleMarker, '');
        // The web listitem retains its focus, descriptive label and arrow-key
        // sorting. A second focusable "button" would promise a click action
        // that does not exist; this is just its touch drag activation area.
        handle.setAttribute('aria-hidden', 'true');
        handle.textContent = '↔ 순서 변경';
        photo.appendChild(handle);
      });
    };
  `;
}
