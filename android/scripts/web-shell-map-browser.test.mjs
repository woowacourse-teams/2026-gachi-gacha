import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createWebShellRuntimeScript } from "../src/domains/webShell/webShellPolicy.ts";

const chromePath =
  process.env.ANDROID_TEST_CHROME ||
  [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].find(existsSync);
const webSource = resolve(
  process.env.ANDROID_TEST_FRONTEND_SOURCE ||
    fileURLToPath(new URL("../../frontend", import.meta.url)),
);
const webModules = resolve(
  process.env.ANDROID_TEST_FRONTEND_NODE_MODULES ||
    join(webSource, "node_modules"),
);
const runtimeFactory = process.env.ANDROID_TEST_RUNTIME_MODULE
  ? (
      await import(
        pathToFileURL(resolve(process.env.ANDROID_TEST_RUNTIME_MODULE)).href
      )
    ).createWebShellRuntimeScript
  : createWebShellRuntimeScript;
const runtimeScript = runtimeFactory();
const navSelector = 'nav[aria-label="하단 메뉴"]';
const listSelector = "[data-fixture-list-area]";
const carouselSelector =
  'section[aria-labelledby="search-store-list-title"] > ul';

async function buildFixture() {
  const requireWeb = createRequire(join(webModules, "../package.json"));
  let esbuild;
  try {
    esbuild = requireWeb("esbuild");
  } catch {
    try {
      esbuild = requireWeb(join(webModules, ".pnpm/node_modules/esbuild"));
    } catch {
      throw new Error(
        "Set ANDROID_TEST_FRONTEND_NODE_MODULES to the installed web dependencies.",
      );
    }
  }
  const modules = {
    "gachi-web-global-styles": "shared/ui/GlobalStyles.tsx",
    "gachi-web-map-page-styles": "routes/search/route.styles.ts",
    "gachi-web-map-results-styles":
      "routes/search/storeResults/StoreResultsSection.styles.ts",
    "gachi-web-map-panel-styles":
      "routes/search/storeResults/map/StoreMapPanel.styles.ts",
    "gachi-web-map-styles": "shared/map/KakaoMap.styles.ts",
    "gachi-web-location-button": "shared/map/CurrentLocationButton.tsx",
    "gachi-web-map-zoom-controls": "shared/map/MapZoomControls.tsx",
    "gachi-web-store-list":
      "routes/search/storeResults/list/StoreListPanel.tsx",
    "gachi-web-header-styles": "shared/ui/AppHeader.styles.ts",
    "gachi-web-selected-gacha":
      "routes/search/selectedGacha/SelectedGachaSummary.tsx",
  };
  const alias = Object.fromEntries(
    Object.entries(modules).map(([name, path]) => {
      const absolute = join(webSource, "src", path);
      assert.ok(
        existsSync(absolute),
        `Set ANDROID_TEST_FRONTEND_SOURCE to the current frontend (${path}).`,
      );
      return [name, absolute];
    }),
  );
  const bundle = await esbuild.build({
    entryPoints: [
      fileURLToPath(new URL("./fixtures/map.mjs", import.meta.url)),
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    nodePaths: [webModules],
    alias: {
      ...alias,
      "@": join(webSource, "src"),
      react: dirname(requireWeb.resolve("react/package.json")),
      "react-dom": dirname(requireWeb.resolve("react-dom/package.json")),
    },
    loader: { ".png": "dataurl", ".svg": "dataurl" },
    plugins: [
      {
        name: "network-free-map-fixture",
        setup(build) {
          // This optional slot is not rendered by the tested map state. Avoid
          // loading its network clients while retaining the real store components.
          build.onResolve(
            { filter: /^@\/features\/affiliateCatalog\/AffiliateCatalogSlot$/ },
            () => ({ path: "affiliate", namespace: "fixture" }),
          );
          build.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
            contents: "export function AffiliateCatalogSlot() { return null; }",
            loader: "js",
          }));
        },
      },
    ],
    define: { "process.env.NODE_ENV": '"production"' },
  });
  return bundle.outputFiles[0].text;
}

// The viewport declaration matches frontend/public/index.html. Safe-area values
// are provided by CDP itself, not by replacing env() with a test CSS variable.
const documentHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/map-fixture.js"></script></body></html>`;

async function connectPage(browser) {
  const address = await new Promise((resolveAddress, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error(`Chromium startup timeout: ${output}`)),
      10000,
    );
    browser.stderr.on("data", (chunk) => {
      output += chunk;
      const match = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(
        output,
      );
      if (match) {
        clearTimeout(timer);
        resolveAddress(`http://127.0.0.1:${match[1]}`);
      }
    });
    browser.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    browser.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Chromium exited ${code}`));
    });
  });
  let target;
  for (let attempt = 0; attempt < 100 && !target; attempt++) {
    const targets = await (await fetch(`${address}/json`)).json();
    target = targets.find((item) => item.type === "page");
    if (!target)
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
  }
  assert.ok(target, "Chromium exposes a test page");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timer);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
  });
  const send = (method, params = {}) =>
    new Promise((resolveMessage, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 10000);
      pending.set(id, { resolve: resolveMessage, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    assert.equal(
      result.exceptionDetails,
      undefined,
      JSON.stringify(result.exceptionDetails),
    );
    return result.result.value;
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 1,
  });
  return { send, evaluate, close: () => socket.close() };
}

test(
  "Android map preserves the real web carousel above the bottom tabs",
  { timeout: 120000 },
  async (t) => {
    assert.ok(
      chromePath && existsSync(chromePath),
      "Set ANDROID_TEST_CHROME to an installed Chromium.",
    );
    const bundle = await buildFixture();
    const temporaryProfile = await mkdtemp(
      join(tmpdir(), "gachi-map-browser-"),
    );
    const server = createServer((request, response) => {
      if (
        new URL(request.url, "http://localhost").pathname === "/map-fixture.js"
      ) {
        response.writeHead(200, {
          "Content-Type": "text/javascript; charset=utf-8",
        });
        response.end(bundle);
        return;
      }
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(documentHtml);
    });
    await new Promise((resolveListen) =>
      server.listen(0, "127.0.0.1", resolveListen),
    );
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = spawn(
      chromePath,
      [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--no-first-run",
        "--disable-background-networking",
        "--remote-debugging-address=127.0.0.1",
        "--remote-debugging-port=0",
        `--user-data-dir=${temporaryProfile}`,
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let page;
    try {
      page = await connectPage(browser);
      const settle = () =>
        page.evaluate(
          "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 450))))",
        );
      const size = (width, height = 820) =>
        page.send("Emulation.setDeviceMetricsOverride", {
          width,
          height,
          deviceScaleFactor: 1,
          mobile: true,
        });
      const safeArea = async (bottom, top = 0) => {
        try {
          await page.send("Emulation.setSafeAreaInsetsOverride", {
            insets: { top, left: 0, bottom, right: 0 },
          });
        } catch (error) {
          throw new Error(
            "This test requires Chromium/CDP Emulation.setSafeAreaInsetsOverride; it must not silently skip nonzero safe areas.",
            { cause: error },
          );
        }
      };
      const inject = async () => {
        await page.evaluate(runtimeScript);
        await settle();
      };
      const navigate = async ({
        width = 393,
        height = 820,
        inset = 0,
        topInset = 0,
        path = "/map",
        injected = true,
      } = {}) => {
        await size(width, height);
        await safeArea(inset, topInset);
        await page.send("Page.navigate", { url: `${origin}${path}` });
        let ready = false;
        for (let attempt = 0; attempt < 100; attempt++) {
          ready = await page.evaluate(
            `location.href === ${JSON.stringify(origin + path)} && document.readyState === 'complete' && !!window.mapFixture`,
          );
          if (ready) break;
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
        }
        assert.ok(ready, `The real React map fixture loaded at ${path}`);
        if (injected) await inject();
        await settle();
      };
      const geometry = () =>
        page.evaluate(`(() => {
      const rect = element => {
        if (!element) return null;
        const r = element.getBoundingClientRect();
        return { top:r.top, bottom:r.bottom, left:r.left, right:r.right, width:r.width, height:r.height };
      };
      const nav = document.querySelector(${JSON.stringify(navSelector)});
      const list = document.querySelector(${JSON.stringify(listSelector)});
      const controls = document.querySelector('[data-fixture-map-controls]');
      const panel = document.querySelector('section[aria-labelledby="search-store-list-title"]');
      const anchor = Array.from(panel?.children || []).find(element =>
        !['BUTTON','DIALOG'].includes(element.tagName) &&
        element.getBoundingClientRect().height > 0 &&
        !element.contains(document.getElementById('search-store-list-title')));
      const status = document.getElementById('search-store-list-title')?.parentElement?.parentElement;
      const markerNames = element => element?.getAttributeNames().filter(name=>name.startsWith('data-gachigacha-android-map-')) || [];
      return {
        width:innerWidth, height:innerHeight,
        nav:rect(nav), navPadding:nav ? parseFloat(getComputedStyle(nav).paddingBottom) : null,
        navDisplay:nav ? getComputedStyle(nav).display : null, navMarkers:markerNames(nav),
        tabs:nav ? Array.from(nav.children, rect) : [],
        list:rect(list), listBottom:list ? parseFloat(getComputedStyle(list).bottom) : null,
        listMarkers:markerNames(list), controls:rect(controls), controlsMarkers:markerNames(controls),
        anchor:rect(anchor), controlsGap:controls ? parseFloat(getComputedStyle(controls).gap) : null,
        map:rect(document.querySelector('[data-fixture-map-canvas]')),
        search:rect(document.querySelector('[data-header-search-slot] a')),
        summary:rect(document.querySelector('[data-fixture-summary-area]')),
        selected:rect(document.querySelector('[data-fixture-summary-area] section')),
        summaryStyle:document.querySelector('[data-fixture-summary-area]') ? {
          background:getComputedStyle(document.querySelector('[data-fixture-summary-area]')).backgroundColor,
          border:getComputedStyle(document.querySelector('[data-fixture-summary-area]')).borderTopWidth,
        } : null,
        research:rect(document.querySelector('[data-fixture-research]')),
        card:rect(document.querySelector(${JSON.stringify(carouselSelector + " [data-store-id] button")})),
        hiddenStatus:status ? getComputedStyle(status).display : null,
        overflow:document.documentElement.scrollWidth > innerWidth,
      };
    })()`);
      const assertMobileLayout = async () => {
        const g = await geometry();
        assert.equal(
          g.navPadding,
          0,
          `Native-safe WebView does not add bottom inset twice: ${JSON.stringify(g)}`,
        );
        assert.ok(
          Math.abs(g.nav.bottom - g.height) <= 1,
          "Tabs end at the visible WebView bottom",
        );
        assert.ok(
          Math.abs(g.nav.top - g.list.bottom - 21) <= 1,
          `The existing web card-to-tab gap is retained: ${JSON.stringify(g)}`,
        );
        assert.ok(
          g.list.top >= 0 && g.list.bottom <= g.nav.top,
          `Entire store panel is visible: ${JSON.stringify(g)}`,
        );
        assert.ok(
          Math.abs(g.anchor.top - g.controls.bottom - 10) <= 1,
          `GPS shares the list-button/carousel gap and clears the carousel itself: ${JSON.stringify(g)}`,
        );
        assert.equal(
          g.controlsGap,
          10,
          "The web-owned zoom/GPS spacing is preserved",
        );
        if (g.card) {
          assert.ok(
            g.card.height >= 104 && g.card.bottom <= g.nav.top,
            "The real store card is fully above the tabs",
          );
          assert.ok(
            g.card.top >= 0,
            "The real store card remains inside the viewport",
          );
        }
        assert.equal(
          g.hiddenStatus,
          "none",
          "Android does not restore a status row hidden by the web",
        );
        assert.equal(g.tabs.length, 4, "The web owns the four navigation tabs");
        assert.equal(
          g.overflow,
          false,
          "The page does not acquire horizontal overflow",
        );
        return g;
      };
      const center = (selector) =>
        page.evaluate(`(() => {
      const element=document.querySelector(${JSON.stringify(selector)});
      if(!element) return null;
      const r=element.getBoundingClientRect();
      return {x:r.left+Math.min(r.width/2,innerWidth-r.left-12), y:r.top+r.height/2};
    })()`);
      const touch = async (start, end = start) => {
        assert.ok(start && end, "Touch targets exist");
        const point = (x, y) => ({
          x,
          y,
          id: 1,
          radiusX: 2,
          radiusY: 2,
          force: 1,
        });
        await page.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [point(start.x, start.y)],
        });
        if (start.x !== end.x || start.y !== end.y) {
          for (let step = 1; step <= 12; step++) {
            await page.send("Input.dispatchTouchEvent", {
              type: "touchMove",
              touchPoints: [
                point(
                  start.x + ((end.x - start.x) * step) / 12,
                  start.y + ((end.y - start.y) * step) / 12,
                ),
              ],
            });
            await new Promise((resolveDelay) => setTimeout(resolveDelay, 16));
          }
        }
        await page.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await settle();
      };
      const screenshot = async (name) => {
        const directory = process.env.ANDROID_TEST_SCREENSHOT_DIR;
        if (!directory) return;
        await mkdir(directory, { recursive: true });
        const { data } = await page.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: false,
        });
        await writeFile(
          join(directory, `${name}.png`),
          Buffer.from(data, "base64"),
        );
      };

      await t.test(
        "uninjected web layout keeps the web safe-area padding",
        async () => {
          for (const inset of [0, 24, 48]) {
            await navigate({ inset, injected: false });
            const g = await geometry();
            assert.equal(
              g.navPadding,
              inset,
              "CDP supplies the real CSS env(safe-area-inset-bottom) value",
            );
            assert.equal(g.listBottom, 78 + inset);
            assert.ok(Math.abs(g.nav.top - g.list.bottom - 21) <= 1);
            assert.deepEqual(g.navMarkers, []);
            assert.deepEqual(g.listMarkers, []);
            assert.equal(
              await page.evaluate(
                "document.documentElement.dataset.gachigachaNativePlatform",
              ),
              undefined,
            );
          }
        },
      );

      for (const width of [320, 360, 393, 412, 767]) {
        for (const inset of [0, 24, 48]) {
          await t.test(
            `${width}px / safe-area ${inset}px keeps cards and tabs separate`,
            async () => {
              await navigate({ width, inset });
              if (width === 393 && inset === 48)
                await screenshot("android-map-393-inset48");
              await assertMobileLayout();
            },
          );
        }
      }

      await t.test(
        "search uses equal top and side margins without double native top insets",
        async () => {
          for (const topInset of [0, 24, 48]) {
            await navigate({ topInset, inset: 48 });
            const g = await geometry();
            assert.ok(
              Math.abs(g.search.top - g.map.top - g.search.left) <= 1,
              JSON.stringify(g),
            );
            assert.ok(
              Math.abs(g.width - g.search.right - g.search.left) <= 1,
              JSON.stringify(g),
            );
            assert.ok(
              Math.abs(g.research.top - g.search.bottom - 10) <= 1,
              JSON.stringify(g),
            );
          }
        },
      );

      await t.test(
        "real selected-gacha loading, long name and errors retain aligned cards and equal vertical gaps",
        async () => {
          for (const width of [320, 393, 767]) {
            await navigate({ width, topInset: 48, inset: 48 });
            for (const state of [
              "success",
              "long",
              "loading",
              "error",
              "none",
              "success",
            ]) {
              await page.evaluate(
                `window.mapFixture.setSummary(${JSON.stringify(state)})`,
              );
              await settle();
              const g = await geometry();
              assert.equal(g.overflow, false, `${width}px / ${state}`);
              if (state === "none") {
                assert.equal(g.summary, null);
                assert.ok(
                  Math.abs(g.research.top - g.search.bottom - 10) <= 1,
                  JSON.stringify(g),
                );
                continue;
              }
              assert.ok(
                g.selected,
                `Actual ${state} selected-gacha component is rendered`,
              );
              assert.ok(
                Math.abs(g.selected.left - g.search.left) <= 1,
                JSON.stringify(g),
              );
              assert.ok(
                Math.abs(g.selected.right - g.search.right) <= 1,
                JSON.stringify(g),
              );
              assert.equal(
                g.summaryStyle.background,
                "rgba(0, 0, 0, 0)",
                "The white oval wrapper is removed, not the actual product card",
              );
              assert.equal(g.summaryStyle.border, "0px");
              assert.ok(
                Math.abs(g.selected.top - g.search.bottom - 10) <= 1,
                JSON.stringify(g),
              );
              assert.ok(
                Math.abs(g.research.top - g.selected.bottom - 10) <= 1,
                JSON.stringify(g),
              );
            }
          }
        },
      );

      await t.test(
        "summary font and height changes reposition research without window resize",
        async () => {
          await navigate({ inset: 48 });
          await page.evaluate(`window.mapFixture.setSummary('long')`);
          await settle();
          await page.evaluate(`window.mapResizeEvents=0; window.addEventListener('resize',()=>window.mapResizeEvents++);
          const style=document.createElement('style'); style.id='fixture-large-text';
          style.textContent='[data-fixture-summary-area] section { min-height:160px; font-size:24px; } [data-fixture-summary-area] h3 { font-size:28px; line-height:1.5; }'; document.head.append(style);`);
          await settle();
          const enlarged = await geometry();
          assert.ok(
            enlarged.selected.height >= 160,
            "Text/display-size variation is active",
          );
          assert.ok(
            Math.abs(enlarged.research.top - enlarged.selected.bottom - 10) <=
              1,
            JSON.stringify(enlarged),
          );
          assert.equal(await page.evaluate("window.mapResizeEvents"), 0);
          await page.evaluate(
            `document.getElementById('fixture-large-text').remove()`,
          );
          await settle();
          const restored = await geometry();
          assert.ok(restored.selected.height < enlarged.selected.height);
          assert.ok(
            Math.abs(restored.research.top - restored.selected.bottom - 10) <=
              1,
            JSON.stringify(restored),
          );
        },
      );

      await t.test(
        "short viewport and taller navigation tabs use their actual bounds",
        async () => {
          await navigate({
            width: 320,
            height: 480,
            inset: 48,
            injected: false,
          });
          await page.evaluate(
            'document.documentElement.style.setProperty("--trade-mobile-tab-height", "88px")',
          );
          await inject();
          let g = await assertMobileLayout();
          assert.ok(g.nav.height >= 89, "The tab-height variation is active");
          assert.ok(
            g.controls.top >= 0,
            "Map controls remain reachable on the short viewport",
          );
          await size(393, 650);
          await settle();
          g = await assertMobileLayout();
          assert.equal(g.height, 650);
        },
      );

      await t.test(
        "tab height changes reposition cards without a window resize event",
        async () => {
          await navigate({ inset: 48 });
          await page.evaluate(
            'window.mapResizeEvents=0; window.addEventListener("resize",()=>window.mapResizeEvents++)',
          );
          for (const height of [88, 104, 56]) {
            await page.evaluate(
              `document.documentElement.style.setProperty('--trade-mobile-tab-height', '${height}px')`,
            );
            await settle();
            const g = await assertMobileLayout();
            assert.equal(g.nav.height, height + 1);
          }
          assert.equal(
            await page.evaluate("window.mapResizeEvents"),
            0,
            "ResizeObserver responds to actual tab size changes without a global resize event",
          );
        },
      );

      await t.test(
        "loading, empty and error results keep their real content above the tabs",
        async () => {
          await navigate({ inset: 48 });
          for (const state of ["loading", "empty", "error", "success"]) {
            await page.evaluate(
              `window.mapFixture.setState(${JSON.stringify(state)})`,
            );
            await settle();
            await assertMobileLayout();
            if (state === "loading")
              assert.equal(
                await page.evaluate(
                  `!!document.querySelector(${JSON.stringify('[aria-label="매장 목록을 불러오는 중"]')})`,
                ),
                true,
              );
            if (state === "empty")
              assert.equal(
                await page.evaluate(
                  'document.querySelector("[data-fixture-list-area]").textContent.includes("등록된 가챠 매장이 없어요")',
                ),
                true,
              );
            if (state === "error") {
              assert.equal(
                await page.evaluate(
                  'document.querySelector("[data-fixture-list-area] [role=alert]").textContent.includes("매장 목록을 불러오지 못했어요")',
                ),
                true,
              );
              await touch(
                await center('[data-fixture-list-area] [role="alert"] button'),
              );
              assert.equal(
                await page.evaluate("window.mapRetryCount"),
                1,
                "The actual React retry action remains usable",
              );
            }
          }
        },
      );

      await t.test(
        "trusted carousel swipes, card clicks, list dialog and map controls keep working",
        async () => {
          await navigate({ width: 393, inset: 48 });
          const row = await page.evaluate(
            `(() => { const r=document.querySelector(${JSON.stringify(carouselSelector)}).getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,height:r.height}; })()`,
          );
          await touch(
            { x: row.right - 36, y: row.top + row.height / 2 },
            { x: row.left + 24, y: row.top + row.height / 2 },
          );
          await page.evaluate("new Promise(resolve=>setTimeout(resolve,350))");
          assert.ok(
            await page.evaluate(
              `document.querySelector(${JSON.stringify(carouselSelector)}).scrollLeft > 25`,
            ),
            "A trusted touch gesture advances the real horizontal carousel",
          );
          assert.ok(
            await page.evaluate("window.mapSelectedStores.some(id=>id>1)"),
            "The real carousel hook updates the selected store",
          );
          assert.ok(
            await page.evaluate(
              'window.mapPointerEvents.some(event=>event.trusted&&event.pointerType==="touch")',
            ),
          );
          assert.deepEqual(
            await page.evaluate("window.mapOpenedStores"),
            [],
            "Swiping does not open store details",
          );

          const selected = await page.evaluate(
            "window.mapFixture.selectedStoreId",
          );
          await touch(
            await center(
              `${carouselSelector} [data-store-id="${selected}"] button`,
            ),
          );
          assert.deepEqual(
            await page.evaluate("window.mapOpenedStores"),
            [selected],
            "The real store click handler still opens details",
          );

          await touch(
            await center(
              'section[aria-labelledby="search-store-list-title"] > button',
            ),
          );
          assert.equal(
            await page.evaluate(
              `document.querySelector(${JSON.stringify('dialog[aria-label="매장 목록"]')}).open`,
            ),
            true,
          );
          await touch(await center('dialog[aria-label="매장 목록"] li button'));
          assert.equal(
            await page.evaluate(
              `document.querySelector(${JSON.stringify('dialog[aria-label="매장 목록"]')}).open`,
            ),
            false,
            "Selecting a list item closes the real dialog",
          );
          assert.equal(
            await page.evaluate("window.mapFixture.selectedStoreId"),
            1,
          );
          await touch(await center('button[aria-label="현재 위치로 이동"]'));
          await touch(await center('button[aria-label="지도 확대"]'));
          assert.deepEqual(await page.evaluate("window.mapControlActions"), [
            "locate",
            "zoom-in",
          ]);
          await touch(await center(`${navSelector} a[href="/trade"]`));
          assert.deepEqual(
            await page.evaluate("window.mapNavigation"),
            ["/trade"],
            "The tab hit target is unobstructed",
          );
        },
      );

      await t.test(
        "desktop breakpoint removes map markers and resizing back restores mobile placement",
        async () => {
          await navigate({ width: 767, inset: 24 });
          await assertMobileLayout();
          await size(768);
          await settle();
          const desktop = await geometry();
          assert.equal(desktop.navDisplay, "none");
          assert.deepEqual(desktop.navMarkers, []);
          assert.deepEqual(desktop.listMarkers, []);
          assert.equal(
            await page.evaluate(
              `document.querySelector(${JSON.stringify(listSelector)}).style.getPropertyValue('--gachigacha-android-map-list-bottom')`,
            ),
            "",
            "The desktop list does not retain the mobile positioning override",
          );
          await size(767);
          await settle();
          await assertMobileLayout();
        },
      );

      await t.test(
        "SPA departure preserves the shared Android tabs on the same reused navigation element",
        async () => {
          await navigate({ inset: 48 });
          await page.evaluate(
            `window.previousMapNav=document.querySelector(${JSON.stringify(navSelector)}); window.mapFixture.navigate('/trade')`,
          );
          await settle();
          assert.equal(
            await page.evaluate(
              `window.previousMapNav===document.querySelector(${JSON.stringify(navSelector)})`,
            ),
            true,
            "This is the same DOM node, not a newly mounted unmarked tab bar",
          );
          const otherRoute = await geometry();
          assert.equal(
            otherRoute.navPadding,
            0,
            "All Android tabs avoid applying the native-safe inset twice",
          );
          assert.deepEqual(otherRoute.navMarkers, []);
          await page.evaluate('window.mapFixture.navigate("/map")');
          await settle();
          await assertMobileLayout();
        },
      );

      await t.test(
        "map without bottom tabs preserves the web-owned list position",
        async () => {
          await navigate({ path: "/map?legacy=1", inset: 48, injected: false });
          const before = await geometry();
          await inject();
          const after = await geometry();
          assert.equal(after.nav, null);
          assert.equal(after.listBottom, before.listBottom);
          assert.deepEqual(after.list, before.list);
          assert.deepEqual(after.listMarkers, []);
          assert.deepEqual(after.controls, before.controls);
          await page.evaluate("window.mapFixture.setHasTabs(true)");
          await settle();
          await assertMobileLayout();
          await page.evaluate("window.mapFixture.setHasTabs(false)");
          await settle();
          const restored = await geometry();
          assert.deepEqual(restored.list, before.list);
          assert.deepEqual(restored.controls, before.controls);
          assert.deepEqual(restored.controlsMarkers, []);
          assert.equal(
            await page.evaluate(
              "window.__gachigachaAndroidMapLayoutObservation",
            ),
            null,
            "Removing the tabs releases the map size observer",
          );
        },
      );

      await t.test("reinjection remains idempotent", async () => {
        await navigate({ inset: 24 });
        const before = await assertMobileLayout();
        await inject();
        await inject();
        assert.deepEqual(await assertMobileLayout(), before);
        assert.equal(
          await page.evaluate(
            'document.querySelectorAll("#gachigacha-android-webview-style").length',
          ),
          1,
        );
      });
    } finally {
      page?.close();
      browser.kill("SIGTERM");
      await new Promise((resolveExit) => {
        if (browser.exitCode !== null) {
          resolveExit();
          return;
        }
        browser.once("exit", resolveExit);
        setTimeout(() => {
          browser.kill("SIGKILL");
          resolveExit();
        }, 3000).unref();
      });
      server.closeAllConnections();
      await new Promise((resolveClose) => server.close(resolveClose));
      await rm(temporaryProfile, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  },
);
