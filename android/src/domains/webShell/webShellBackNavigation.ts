/** Android-only UI depth adapter. Always invoke the web's own React handlers. */
export function createWebShellBackNavigationScript(): string {
  return `
    if (!window.__gachigachaAndroidBackNavigation) {
      const post = (message) => window.ReactNativeWebView?.postMessage(JSON.stringify(message));
      const visible = (element) => element instanceof HTMLElement &&
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility !== 'hidden' &&
        !element.closest('[hidden], [aria-hidden="true"], [inert]');
      const overlaySelector = 'dialog[open], [role="dialog"], [role="alertdialog"], [role="menu"], [aria-label="가챠 검색 결과"]';
      const modal = (element) => {
        try { return element.matches(':modal'); } catch { return false; }
      };
      const layer = (element) => {
        let z = 0;
        for (let node = element; node instanceof HTMLElement; node = node.parentElement) {
          z = Math.max(z, Number.parseInt(getComputedStyle(node).zIndex, 10) || 0);
        }
        return z;
      };
      const topOverlay = () => Array.from(document.querySelectorAll(overlaySelector))
        .filter(visible).sort((a, b) => {
          if (a.contains(b)) return -1;
          if (b.contains(a)) return 1;
          const modalOrder = Number(modal(a)) - Number(modal(b));
          if (modalOrder) return modalOrder;
          const zOrder = layer(a) - layer(b);
          if (zOrder) return zOrder;
          return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        }).at(-1);
      const closeOverlay = (overlay) => {
        if (overlay.getAttribute('role') === 'menu') {
          const trigger = Array.from(overlay.parentElement?.querySelectorAll('button[aria-haspopup="menu"][aria-expanded="true"]') || [])
            .find(button => visible(button) && !button.disabled && button.parentElement === overlay.parentElement);
          if (trigger) trigger.click();
          return;
        }
        const own = (button) => visible(button) && !button.disabled &&
          button.closest(overlaySelector) === overlay;
        const close = Array.from(overlay.querySelectorAll('button[aria-label], a[aria-label]'))
          .find(button => own(button) && /닫기$/.test(button.getAttribute('aria-label') || ''));
        if (close) { close.click(); return; }
        const cancel = Array.from(overlay.querySelectorAll('button'))
          .find(button => own(button) && button.textContent.trim() === '취소');
        if (cancel) { cancel.click(); return; }
        // Unknown/busy overlays consume Back. Do not broadcast Escape: global
        // listeners belonging to an underlying layer could close two levels.
      };

      let route = location.pathname + location.search;
      let categories = [];
      let restoringCategory = false;
      let formState = null;
      let pendingLeave = null;
      let nextLinkRequest = 1000000000;
      let replayLink = false;
      const currentForm = () => document.querySelector('form#trade-create-form, form#trade-edit-form');
      const snapshot = (form) => JSON.stringify({
        values: Array.from(form.elements).filter(element => element.name && element.type !== 'file' &&
          element.type !== 'submit' && (!['radio', 'checkbox'].includes(element.type) || element.checked))
          .map(element => [element.name, element.value]),
        photos: Array.from(form.querySelectorAll('[data-trade-photo-index] img, img[aria-label="등록할 거래 사진"], img[alt="등록할 거래 사진"]'))
          .map(image => image.getAttribute('src')),
      });
      const sync = () => {
        const nextRoute = location.pathname + location.search;
        if (nextRoute !== route) {
          route = nextRoute;
          categories = [];
          formState = null;
          pendingLeave = null;
        }
        const form = currentForm();
        if (form && form !== formState?.form) formState = { form, initial: snapshot(form), filesChanged: false };
        if (!form) formState = null;
      };
      const dirty = () => {
        sync();
        return formState && (formState.filesChanged || snapshot(formState.form) !== formState.initial);
      };
      const busy = () => currentForm()?.getAttribute('aria-busy') === 'true';
      const askLeave = (requestId, link = null) => {
        if (pendingLeave) return;
        pendingLeave = { requestId, route, form: currentForm(), link };
        post({ type: 'gachigacha:confirm-leave-trade', requestId, path: location.pathname });
      };
      const resolveLeave = (requestId, accepted) => {
        const pending = pendingLeave;
        if (!pending || pending.requestId !== requestId) return;
        pendingLeave = null;
        sync();
        if (!accepted || !pending || pending.requestId !== requestId ||
          pending.route !== route || pending.form !== currentForm() || busy() || topOverlay()) return;
        if (pending.link) {
          if (!pending.link.isConnected) return;
          replayLink = true;
          try { pending.link.click(); } finally { replayLink = false; }
        } else if (typeof history.state?.idx === 'number' ? history.state.idx > 0 : history.length > 1) {
          history.back();
        } else {
          location.assign('/trade');
        }
      };
      document.addEventListener('click', (event) => {
        sync();
        const target = event.target instanceof Element ? event.target : null;
        const category = target?.closest('[aria-label="가챠 카테고리"] button[aria-pressed]');
        if (category && !restoringCategory && category.getAttribute('aria-pressed') !== 'true') {
          const previous = category.closest('[aria-label="가챠 카테고리"]').querySelector('button[aria-pressed="true"]');
          if (previous) categories.push(previous.textContent.trim());
        }
        if (replayLink || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const link = target?.closest('a[href]');
        if (!link || link.hasAttribute('download') || link.target === '_blank') return;
        const destination = new URL(link.href, location.href);
        if (destination.origin !== location.origin || destination.pathname + destination.search === route) return;
        if (busy() || dirty()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (!busy()) askLeave(++nextLinkRequest, link);
        }
      }, true);
      // File inputs are reset by the web after selection. Remember the change
      // before React clears input.value; even a photo-only draft must be guarded.
      document.addEventListener('change', (event) => {
        sync();
        if (formState && event.target instanceof HTMLInputElement && event.target.type === 'file' &&
          formState.form.contains(event.target) && event.target.files?.length) formState.filesChanged = true;
      }, true);
      for (const method of ['pushState', 'replaceState']) {
        const original = history[method];
        history[method] = function(...args) { const result = original.apply(this, args); sync(); return result; };
      }
      window.addEventListener('popstate', sync);
      new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });
      sync();
      window.__gachigachaAndroidBackNavigation = {
        resolveLeave,
        handle(requestId) {
          sync();
          const overlay = topOverlay();
          if (overlay) { closeOverlay(overlay); return true; }
          // Some menus have no role. Expanded, controlled triggers are their
          // public close contract; do not click destructive menu items.
          const menu = Array.from(document.querySelectorAll('button[aria-expanded="true"][aria-controls]'))
            .find(button => visible(button) && !button.disabled && visible(document.getElementById(button.getAttribute('aria-controls'))));
          if (menu) { menu.click(); return true; }
          if (busy()) return true;
          if (dirty()) { askLeave(requestId); return true; }
          const nav = document.querySelector('[aria-label="가챠 카테고리"]');
          while (nav && categories.length) {
            const previous = categories.pop();
            const button = Array.from(nav.querySelectorAll('button[aria-pressed]'))
              .find(item => item.textContent.trim() === previous && !item.disabled);
            if (!button || button.getAttribute('aria-pressed') === 'true') continue;
            restoringCategory = true;
            try { button.click(); button.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
            finally { restoringCategory = false; }
            return true;
          }
          return false;
        },
      };
    }
  `;
}

export function createWebShellOverlayBackScript(requestId: number, expiresAt = Date.now() + 1_500): string {
  if (!Number.isSafeInteger(requestId) || requestId <= 0 || !Number.isSafeInteger(expiresAt)) {
    throw new Error('뒤로가기 요청 번호가 올바르지 않습니다.');
  }
  return `(() => {
    if (Date.now() > ${expiresAt}) return;
    let handled = true;
    try {
      ${createWebShellBackNavigationScript()}
      handled = window.__gachigachaAndroidBackNavigation.handle(${requestId});
    } catch {}
    window.ReactNativeWebView?.postMessage(JSON.stringify({
      type: 'gachigacha:overlay-back-result', requestId: ${requestId}, handled,
    }));
  })(); true;`;
}

export function createWebShellConfirmLeaveScript(requestId: number, accepted: boolean): string {
  if (!Number.isSafeInteger(requestId) || requestId <= 0) throw new Error('잘못된 이동 확인 요청입니다.');
  return `window.__gachigachaAndroidBackNavigation?.resolveLeave(${requestId}, ${accepted === true}); true;`;
}
