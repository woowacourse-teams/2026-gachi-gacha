/**
 * Trade detail/edit and updates start at the top after their React content is
 * ready. List routes retain the browser's existing history/scroll restoration.
 */
export function createWebShellRouteScrollScript(): string {
  return `
    if (!window.__gachigachaAndroidRouteScrollInstalled) {
      window.__gachigachaAndroidRouteScrollInstalled = true;
      let previousPath = window.location.pathname;
      let pendingScroll = null;
      let scrollFrame = null;

      const getReadyContent = (path) => {
        if (path === '/updates') {
          return document.querySelector('[aria-label="서비스 업데이트 목록"]');
        }
        if (/^\\/trade\\/[1-9]\\d*\\/edit$/.test(path)) {
          return document.querySelector('main form#trade-edit-form');
        }
        if (/^\\/trade\\/[1-9]\\d*$/.test(path)) {
          // Every detail has comments, including guest/non-owner views without
          // an edit link and trades whose product photos are unavailable.
          return document.querySelector('main #trade-comments-title');
        }
        return null;
      };
      const isTopEntry = (path) => path === '/updates' ||
        /^\\/trade\\/[1-9]\\d*(?:\\/edit)?$/.test(path);
      const cancelScroll = () => {
        if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
        scrollFrame = null;
        pendingScroll = null;
      };
      const isCurrentTarget = (target) => pendingScroll === target &&
        window.location.pathname === target.path && !window.location.hash;
      const isReady = (target) => {
        const content = getReadyContent(target.path);
        // pushState changes the URL before React replaces the previous detail.
        // Do not mistake that stale detail's comments for the new page.
        return content && content !== target.previousContent;
      };
      const resetDocumentScroll = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        const root = document.scrollingElement;
        if (root && (root.scrollTop !== 0 || root.scrollLeft !== 0)) {
          root.scrollTop = 0;
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
        if (!isReady(target)) return;
        // Browser popstate restoration and React's loading/content commits can
        // run after the URL changes. Check readiness again after two frames.
        scrollFrame = window.requestAnimationFrame(() => {
          scrollFrame = window.requestAnimationFrame(() => {
            scrollFrame = null;
            if (!isCurrentTarget(target) || !isReady(target)) return;
            resetDocumentScroll();
            // One bounded follow-up also covers restoration queued after the
            // first reset. Later renders never keep pulling a reader to top.
            scrollFrame = window.requestAnimationFrame(() => {
              scrollFrame = null;
              if (!isCurrentTarget(target)) return;
              if (!isReady(target)) return;
              resetDocumentScroll();
              pendingScroll = null;
            });
          });
        });
      };
      const checkRoute = (initial = false, previousContent = null) => {
        const path = window.location.pathname;
        if (window.location.hash) cancelScroll();
        if (!initial && path === previousPath) return;
        previousPath = path;
        cancelScroll();
        if (!window.location.hash && isTopEntry(path)) {
          pendingScroll = { path, previousContent };
          tryScroll();
        }
      };
      for (const method of ['pushState', 'replaceState']) {
        const original = window.history[method];
        window.history[method] = function(...args) {
          const previousContent = getReadyContent(previousPath);
          const result = original.apply(this, args);
          checkRoute(false, previousContent);
          return result;
        };
      }
      window.addEventListener('popstate', () => {
        checkRoute(false, getReadyContent(previousPath));
      });
      window.addEventListener('hashchange', () => {
        if (window.location.hash) cancelScroll();
      });
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) checkRoute(true);
      });
      // Browser/native restoration is not user intent. Only actual interaction
      // cancels a pending correction, including a delayed API/render response.
      for (const event of ['pointerdown', 'touchstart', 'wheel', 'keydown']) {
        window.addEventListener(event, cancelScroll, { passive: true });
      }
      new MutationObserver(tryScroll).observe(document.documentElement, {
        childList: true, subtree: true,
      });
      document.addEventListener('DOMContentLoaded', tryScroll, { once: true });
      checkRoute(true);
    }
  `;
}
