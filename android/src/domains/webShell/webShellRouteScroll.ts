/** Keep web-owned routes, but wait for React content before correcting scroll. */
export function createWebShellRouteScrollScript(): string {
  return `
    if (!window.__gachigachaAndroidRouteScrollInstalled) {
      window.__gachigachaAndroidRouteScrollInstalled = true;
      // React Router keys distinguish history entries, including repeated URLs.
      // Never replace its usr/key/idx state or disable browser restoration.
      const positions = new Map();
      const readEntry = () => {
        const state = window.history.state;
        const key = state && typeof state.key === 'string' && state.key
          ? 'key:' + state.key
          : state && Number.isInteger(state.idx) ? 'index:' + state.idx : 'url';
        const path = window.location.pathname;
        const search = window.location.search;
        const hash = window.location.hash;
        return { path, search, hash, id: key + '|' + path + search + hash };
      };
      let currentEntry = readEntry();
      let pendingScroll = null;
      let scrollFrame = null;
      let expiryTimer = null;

      const isList = (path) => path === '/trade' || path === '/mypage/trades';
      const getListPanel = (path) => {
        if (!isList(path)) return null;
        if (path === '/mypage/trades' && !document.querySelector(
          'main nav[aria-label="내 교환글 상태 필터"]'
        )) return null;
        return document.querySelector('main > section[aria-live="polite"]');
      };
      const getReadyContent = (path) => {
        if (isList(path)) return getListPanel(path);
        if (path === '/updates') {
          return document.querySelector('[aria-label="서비스 업데이트 목록"]');
        }
        if (path === '/trade/new') {
          return document.querySelector('main form#trade-create-form');
        }
        if (/^\\/trade\\/[1-9]\\d*\\/edit$/.test(path)) {
          return document.querySelector('main form#trade-edit-form');
        }
        if (/^\\/trade\\/[1-9]\\d*$/.test(path)) {
          return document.querySelector('main #trade-comments-title');
        }
        return null;
      };
      const isTopEntry = (path) => path === '/updates' ||
        path === '/trade/new' || path === '/mypage/trades' ||
        /^\\/trade\\/[1-9]\\d*(?:\\/edit)?$/.test(path);
      const getCards = (panel) => {
        if (!panel) return [];
        const seen = new Set();
        return Array.from(panel.querySelectorAll('a[href]')).filter((card) => {
          const href = card.getAttribute('href') || '';
          if (!/^\\/trade\\/[1-9]\\d*$/.test(href) || seen.has(href)) return false;
          seen.add(href);
          return true;
        });
      };
      const signature = (panel) => getCards(panel).map((card) =>
        card.getAttribute('href')).join('|');
      const rememberCurrent = () => {
        if (pendingScroll || currentEntry.hash || !isList(currentEntry.path) ||
          readEntry().id !== currentEntry.id) return;
        const panel = getListPanel(currentEntry.path);
        if (!panel || panel.querySelector('[role="status"], [role="alert"]')) return;
        const cards = getCards(panel);
        const anchor = cards.find((card) => {
          const rect = card.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        });
        positions.delete(currentEntry.id);
        positions.set(currentEntry.id, {
          top: window.scrollY,
          count: cards.length,
          anchor: anchor ? {
            href: anchor.getAttribute('href'), offset: anchor.getBoundingClientRect().top,
          } : null,
        });
        if (positions.size > 60) positions.delete(positions.keys().next().value);
      };
      const cancelScroll = () => {
        if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
        if (expiryTimer !== null) window.clearTimeout(expiryTimer);
        scrollFrame = null;
        expiryTimer = null;
        pendingScroll = null;
      };
      const isCurrentTarget = (target) => pendingScroll === target &&
        readEntry().id === target.entry.id && !window.location.hash;
      const getDestination = (target) => {
        const content = getReadyContent(target.entry.path);
        if (!content) return null;
        if (target.mode === 'top') {
          if (isList(target.entry.path) && content.querySelector('[role="status"]')) return null;
          return content !== target.previousContent ? 0 : null;
        }
        if (content.querySelector('[role="status"]')) {
          target.sawLoading = true;
          return null;
        }
        if (content.querySelector('[role="alert"]')) {
          cancelScroll();
          return null;
        }
        const cards = getCards(content);
        if (content === target.previousContent && !target.sawLoading &&
          signature(content) === target.previousSignature) return null;

        // The web list's local page state is lost on unmount. Reuse its own
        // read-only pagination, exclusively on a saved list POP. Never invent
        // API requests or retry a failing/no-progress page.
        const moreText = target.entry.path === '/trade' ? '더보기' : '교환글 더보기';
        const more = Array.from(content.querySelectorAll('button')).find((button) =>
          [moreText, '불러오는 중...'].includes(button.textContent.trim()));
        if (target.morePending) {
          if (cards.length > target.morePending.count) target.morePending = null;
          else if (more && (more.disabled || more.textContent.trim() !== moreText)) {
            target.morePending.sawBusy = true;
            return null;
          } else {
            if (!more || target.morePending.sawBusy) cancelScroll();
            return null;
          }
        }
        if (cards.length < target.saved.count && more) {
          if (more.disabled || more.textContent.trim() !== moreText) return null;
          if (target.moreAttempts >= target.maxMoreAttempts) {
            cancelScroll();
            return null;
          }
          target.moreAttempts += 1;
          target.morePending = { count: cards.length, sawBusy: false };
          more.click();
          return null;
        }
        const anchor = target.saved.anchor && cards.find((card) =>
          card.getAttribute('href') === target.saved.anchor.href);
        const top = Math.max(0, anchor
          ? window.scrollY + anchor.getBoundingClientRect().top - target.saved.anchor.offset
          : target.saved.top);
        const root = document.scrollingElement;
        const max = Math.max(0, (root ? root.scrollHeight : 0) - window.innerHeight);
        if (top > max + 1) {
          // Removed items can make the final list genuinely shorter. Otherwise
          // wait for its async layout/images instead of accepting a clamped 0.
          return cards.length < target.saved.count && !more ? max : null;
        }
        return top;
      };
      const setDocumentScroll = (top) => {
        window.scrollTo({ top, left: 0, behavior: 'instant' });
        const root = document.scrollingElement;
        if (root && (Math.abs(root.scrollTop - top) > 1 || root.scrollLeft !== 0)) {
          root.scrollTop = top;
          root.scrollLeft = 0;
        }
      };
      const tryScroll = () => {
        if (!pendingScroll || scrollFrame !== null) return;
        const target = pendingScroll;
        if (!isCurrentTarget(target)) {
          cancelScroll();
          return;
        }
        if (getDestination(target) === null) return;
        scrollFrame = window.requestAnimationFrame(() => {
          scrollFrame = window.requestAnimationFrame(() => {
            scrollFrame = null;
            if (!isCurrentTarget(target)) return;
            const top = getDestination(target);
            if (top === null) return;
            setDocumentScroll(top);
            scrollFrame = window.requestAnimationFrame(() => {
              scrollFrame = null;
              if (!isCurrentTarget(target)) return;
              const finalTop = getDestination(target);
              if (finalTop === null) return;
              setDocumentScroll(finalTop);
              cancelScroll();
              rememberCurrent();
            });
          });
        });
      };
      const checkRoute = (kind, previousContent = null, previousSignature = '') => {
        const previous = currentEntry;
        const next = readEntry();
        currentEntry = next;
        const sameUrl = previous.path === next.path && previous.search === next.search &&
          previous.hash === next.hash;
        // Router initialization adds idx with replaceState and no URL. Keep an
        // in-flight correction while preserving the caller's state untouched.
        if (kind === 'replaceState' && sameUrl) {
          if (pendingScroll) pendingScroll.entry = next;
          if (positions.has(previous.id)) positions.set(next.id, positions.get(previous.id));
          return;
        }
        cancelScroll();
        if (next.hash) return;
        // A BFCache document already retains the user's list and its position.
        if (kind === 'pageshow' && isList(next.path)) return;
        const saved = kind === 'popstate' && isList(next.path) ? positions.get(next.id) : null;
        const newPath = kind === 'initial' || kind === 'pageshow' || previous.path !== next.path;
        if (!saved && (!newPath || !isTopEntry(next.path))) return;
        const target = {
          entry: next, mode: saved ? 'restore' : 'top', saved,
          previousContent, previousSignature, sawLoading: false,
          morePending: null, moreAttempts: 0,
          maxMoreAttempts: saved ? Math.min(30,
            Math.ceil(saved.count / (next.path === '/trade' ? 20 : 10))) : 0,
        };
        pendingScroll = target;
        expiryTimer = window.setTimeout(() => {
          if (pendingScroll === target) cancelScroll();
        }, 12000);
        tryScroll();
      };
      for (const method of ['pushState', 'replaceState']) {
        const original = window.history[method];
        window.history[method] = function(...args) {
          rememberCurrent();
          const previousContent = getReadyContent(currentEntry.path);
          const previousSignature = isList(currentEntry.path) ? signature(previousContent) : '';
          const result = original.apply(this, args);
          checkRoute(method, previousContent, previousSignature);
          return result;
        };
      }
      window.addEventListener('popstate', () => {
        const previousContent = getReadyContent(currentEntry.path);
        checkRoute('popstate', previousContent,
          isList(currentEntry.path) ? signature(previousContent) : '');
      });
      window.addEventListener('hashchange', () => {
        if (window.location.hash) cancelScroll();
      });
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) checkRoute('pageshow');
      });
      window.addEventListener('scroll', rememberCurrent, { passive: true });
      // Browser/native restoration is not user intent. Only actual interaction
      // cancels a pending correction, including a delayed API/render response.
      for (const event of ['pointerdown', 'touchstart', 'wheel', 'keydown']) {
        window.addEventListener(event, cancelScroll, { passive: true });
      }
      const onContentChanged = () => { tryScroll(); rememberCurrent(); };
      new MutationObserver(onContentChanged).observe(document.documentElement, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['disabled', 'aria-busy'],
      });
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(tryScroll).observe(document.documentElement);
      }
      window.addEventListener('resize', tryScroll);
      document.addEventListener('load', tryScroll, true);
      document.addEventListener('DOMContentLoaded', onContentChanged, { once: true });
      checkRoute('initial');
      rememberCurrent();
    }
  `;
}
