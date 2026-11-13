import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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

async function buildFixture() {
  const requireWeb = createRequire(join(webModules, "../package.json"));
  let esbuild;
  try {
    esbuild = requireWeb("esbuild");
  } catch {
    esbuild = requireWeb(join(webModules, ".pnpm/node_modules/esbuild"));
  }
  const aliases = {
    "gachi-web-chat-page": join(webSource, "src/routes/chat/ChatPage.tsx"),
    "gachi-web-global-styles": join(
      webSource,
      "src/shared/ui/GlobalStyles.tsx",
    ),
  };
  for (const path of Object.values(aliases))
    assert.ok(existsSync(path), `Missing real frontend source: ${path}`);
  const mocks = {
    "@/shared/ui/AppHeader":
      'import React from "react"; export function AppHeader() { return React.createElement("header", null, "앱 헤더"); }',
    "@/features/memberSafety/UserSafetyMenu":
      "export function UserSafetyMenu() { return null; }",
    "@/shared/analytics/analyticsClient":
      "export function captureAnalyticsEvent() {}",
    "@/shared/ui/PhotoViewer": "export function PhotoViewer() { return null; }",
    "./components/ConversationList":
      'import React from "react"; export default function ConversationList() { return React.createElement("aside", null, "채팅 목록"); }',
  };
  const bundle = await esbuild.build({
    entryPoints: [
      fileURLToPath(new URL("./fixtures/chat-layout.mjs", import.meta.url)),
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    nodePaths: [webModules],
    alias: {
      ...aliases,
      "@": join(webSource, "src"),
      react: dirname(requireWeb.resolve("react/package.json")),
      "react-dom": dirname(requireWeb.resolve("react-dom/package.json")),
    },
    loader: { ".png": "dataurl", ".svg": "dataurl" },
    plugins: [
      {
        name: "network-free-real-chat",
        setup(build) {
          build.onResolve(
            { filter: /^(?:@\/|\.\/components\/ConversationList$)/ },
            ({ path }) =>
              mocks[path] ? { path, namespace: "fixture" } : undefined,
          );
          build.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
            contents: mocks[path],
            loader: "js",
          }));
          // Chromium's system safe area is independent of its simulated visual
          // viewport. Substitute only env() in the real component source, keeping
          // every layout declaration, React state and scroll effect unchanged.
          build.onLoad(
            { filter: /(?:ChatPage|ChatRoomPanel)\.tsx$/ },
            async ({ path }) => ({
              contents: (await readFile(path, "utf8")).replaceAll(
                "env(safe-area-inset-bottom)",
                "var(--fixture-safe-area-bottom, 0px)",
              ),
              loader: "tsx",
            }),
          );
        },
      },
    ],
    define: { "process.env.NODE_ENV": '"production"' },
  });
  return bundle.outputFiles[0].text;
}

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
  const targets = await (await fetch(`${address}/json`)).json();
  const target = targets.find((item) => item.type === "page");
  assert.ok(target, "Chromium test page available");
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
  return { send, evaluate, close: () => socket.close() };
}

const measurement = `(() => {
  const composer = document.querySelector('form[aria-label="메시지 입력 영역"]');
  const area = composer.parentElement;
  const pane = area.previousElementSibling;
  const room = composer.closest('section');
  const rect = element => { const r = element.getBoundingClientRect(); return { top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height }; };
  return {
    area: rect(area), composer: rect(composer), pane: rect(pane), room: rect(room), surface: rect(room.parentElement),
    paddingTop: parseFloat(getComputedStyle(area).paddingTop), paddingBottom: parseFloat(getComputedStyle(area).paddingBottom),
    scrollTop: pane.scrollTop, scrollHeight: pane.scrollHeight, clientHeight: pane.clientHeight,
    bottomDistance: pane.scrollHeight - pane.clientHeight - pane.scrollTop,
    last: rect(pane.lastElementChild), viewportHeight: visualViewport.height,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    preview: !!document.querySelector('[aria-label="전송할 사진"]'),
  };
})()`;

test(
  "Android chat preserves real web composer and scroll position through IME geometry changes",
  { timeout: 120000 },
  async (t) => {
    assert.ok(chromePath, "Set ANDROID_TEST_CHROME to an installed Chromium.");
    const bundle = await buildFixture();
    const profile = await mkdtemp(join(tmpdir(), "gachi-chat-layout-"));
    const server = createServer((request, response) => {
      const script =
        new URL(request.url, "http://localhost").pathname === "/fixture.js";
      response.writeHead(200, {
        "Content-Type": script
          ? "text/javascript; charset=utf-8"
          : "text/html; charset=utf-8",
      });
      response.end(
        script
          ? bundle
          : '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>',
      );
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
        `--user-data-dir=${profile}`,
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let page;
    try {
      page = await connectPage(browser);
      const settle = () =>
        page.evaluate(
          "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 100))))",
        );
      const size = (width, height) =>
        page.send("Emulation.setDeviceMetricsOverride", {
          width,
          height,
          deviceScaleFactor: 1,
          mobile: true,
        });
      const measure = () => page.evaluate(measurement);
      const navigate = async ({
        width = 393,
        inset = 0,
        presentation = "split",
        injected = true,
      } = {}) => {
        await size(width, 820);
        const url = `${origin}/chat/1?presentation=${presentation}&inset=${inset}`;
        await page.send("Page.navigate", { url });
        let ready;
        for (let attempt = 0; attempt < 100; attempt++) {
          ready = await page.evaluate(
            `location.href === ${JSON.stringify(url)} && !!window.chatFixture && !!document.querySelector('form[aria-label="메시지 입력 영역"]')`,
          );
          if (ready) break;
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
        }
        assert.ok(ready, "Real web ChatPage loaded");
        await settle();
        if (injected) {
          await page.evaluate(runtimeScript);
          await settle();
        }
      };
      const focus = async () => {
        await page.evaluate(
          "document.querySelector('input[aria-label=\"메시지\"]').focus({ preventScroll:true })",
        );
        await settle();
      };
      const resizeVisual = async (height) => {
        await page.evaluate(
          `window.chatFixture.resizeVisual(${JSON.stringify(height)})`,
        );
        await settle();
      };
      const pinBottom = async () => {
        await page.evaluate(
          `(() => { const pane = document.querySelector('form[aria-label="메시지 입력 영역"]').parentElement.previousElementSibling; pane.scrollTop = pane.scrollHeight; pane.dispatchEvent(new Event('scroll')); })()`,
        );
        await settle();
      };
      const assertPinned = async (label, allowClippedTallMessage = false) => {
        const state = await measure();
        assert.ok(
          state.bottomDistance <= 2,
          `${label}: bottom distance ${state.bottomDistance}`,
        );
        assert.ok(
          state.surface.bottom <= state.viewportHeight + 1,
          `${label}: surface ${state.surface.bottom} > viewport ${state.viewportHeight}`,
        );
        assert.ok(
          state.composer.bottom <= state.viewportHeight + 1,
          `${label}: composer visible`,
        );
        if (!allowClippedTallMessage)
          assert.ok(
            state.last.bottom <= state.pane.bottom + 1,
            `${label}: last bubble is visible`,
          );
        assert.equal(
          state.horizontalOverflow,
          false,
          `${label}: no horizontal overflow`,
        );
        return state;
      };
      const readHistory = async () => {
        await page.evaluate(
          `(() => { const pane = document.querySelector('form[aria-label="메시지 입력 영역"]').parentElement.previousElementSibling; pane.scrollTop = 300; pane.dispatchEvent(new Event('scroll')); window.chatHistoryAnchor = [...pane.children].find(child => child.getBoundingClientRect().bottom > pane.getBoundingClientRect().top); })()`,
        );
        await settle();
        return page.evaluate(
          `window.chatHistoryAnchor.getBoundingClientRect().top - window.chatHistoryAnchor.parentElement.getBoundingClientRect().top`,
        );
      };
      const assertHistory = async (offset, label) => {
        const current = await page.evaluate(
          `window.chatHistoryAnchor.getBoundingClientRect().top - window.chatHistoryAnchor.parentElement.getBoundingClientRect().top`,
        );
        assert.ok(
          Math.abs(current - offset) <= 1,
          `${label}: history anchor shifted ${current - offset}px`,
        );
        assert.ok(
          (await measure()).bottomDistance > 100,
          `${label}: did not jump to latest`,
        );
      };

      await t.test(
        "unmodified current web reproduces extra safe area and clipped latest message",
        async () => {
          await navigate({ inset: 48, injected: false });
          const before = await measure();
          assert.equal(before.paddingBottom - before.paddingTop, 48);
          assert.ok(before.bottomDistance <= 2);
          await focus();
          await size(393, 460);
          await settle();
          const after = await measure();
          assert.ok(
            after.bottomDistance > 200,
            `baseline needs the reported resize regression, distance=${after.bottomDistance}`,
          );
          assert.ok(
            after.last.bottom > after.pane.bottom,
            "baseline latest message is clipped",
          );
        },
      );

      for (const presentation of ["split", "drawer"]) {
        for (const width of [320, 393, 412]) {
          for (const inset of [0, 24, 48]) {
            await t.test(
              `${presentation} ${width}px safe-area ${inset}: composer gap and pinned keyboard open/close`,
              async () => {
                await navigate({ presentation, width, inset });
                const initial = await assertPinned("closed");
                assert.equal(
                  initial.paddingBottom,
                  initial.paddingTop,
                  "native safe area is not charged twice",
                );
                assert.equal(
                  initial.paddingTop,
                  8,
                  "preserve real mobile web visual padding",
                );
                await focus();
                await resizeVisual(460);
                await assertPinned("visual viewport-only IME open");
                await resizeVisual(null);
                await assertPinned("visual viewport-only IME close");
                await size(width, 460);
                await settle();
                await assertPinned("layout viewport IME open");
                await size(width, 820);
                await settle();
                await assertPinned("layout viewport IME close");
              },
            );
          }
        }
        await t.test(
          `${presentation}: history reader remains anchored through open/close and photo preview`,
          async () => {
            await navigate({ presentation, inset: 48 });
            const offset = await readHistory();
            await focus();
            await resizeVisual(460);
            await assertHistory(offset, "visual open");
            await resizeVisual(null);
            await assertHistory(offset, "visual close");
            await size(393, 460);
            await settle();
            await assertHistory(offset, "layout open");
            await size(393, 820);
            await settle();
            await assertHistory(offset, "layout close");
            await page.evaluate("window.chatFixture.attachPhoto()");
            await settle();
            assert.equal((await measure()).preview, true);
            await assertHistory(offset, "photo preview opened");
            await page.evaluate(
              "document.querySelector('button[aria-label=\"qa.png 사진 취소\"]').click()",
            );
            await settle();
            await assertHistory(offset, "photo preview closed");
          },
        );
        await t.test(
          `${presentation}: pinned photo preview, tiny viewport and web-owned new-message scrolling`,
          async () => {
            await navigate({ presentation, inset: 24 });
            await focus();
            await page.evaluate("window.chatFixture.attachPhoto()");
            await settle();
            assert.equal((await measure()).preview, true);
            await assertPinned("photo preview opened");
            await page.evaluate(
              "document.querySelector('button[aria-label=\"qa.png 사진 취소\"]').click()",
            );
            await settle();
            await assertPinned("photo preview closed");
            await resizeVisual(220);
            const tiny = await assertPinned("tiny visual viewport", true);
            assert.ok(
              tiny.pane.height > 0,
              "tiny viewport still offers message area",
            );
            await resizeVisual(null);
            await assertPinned("tiny viewport restored");
            await readHistory();
            await page.evaluate("window.chatFixture.appendMessage()");
            await settle();
            await assertPinned("web new-message effect still owns scrolling");
            await readHistory();
            await page.evaluate("window.chatFixture.switchRoom()");
            await settle();
            await assertPinned("web room-switch effect still owns scrolling");
          },
        );
      }

      for (const gesture of ["wheel", "touchmove", "keydown"]) {
        await t.test(
          `${gesture}: reading intent during the resize frame wins over stale bottom pinning`,
          async () => {
            await navigate({ inset: 24 });
            await focus();
            const before = await measure();
            const during = await page.evaluate(`new Promise(resolve => {
              window.chatFixture.resizeVisual(460);
              requestAnimationFrame(() => {
                const pane = document.querySelector('form[aria-label="메시지 입력 영역"]').parentElement.previousElementSibling;
                const event = ${JSON.stringify(gesture)} === 'wheel'
                  ? new WheelEvent('wheel', { deltaY: -60, bubbles: true })
                  : ${JSON.stringify(gesture)} === 'keydown'
                    ? new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true })
                    : new Event('touchmove', { bubbles: true });
                pane.dispatchEvent(event);
                pane.scrollTop = 300;
                pane.dispatchEvent(new Event('scroll'));
                resolve({ height: pane.clientHeight, top: pane.scrollTop });
              });
            })`);
            assert.ok(
              during.height < before.clientHeight,
              "user reading input happens after layout shrinks, before ResizeObserver",
            );
            await settle();
            const after = await measure();
            assert.ok(
              Math.abs(after.scrollTop - during.top) <= 1,
              `user reading position changed from ${during.top} to ${after.scrollTop}`,
            );
            assert.ok(after.bottomDistance > 100);
          },
        );
      }

      await t.test(
        "composer follows a future web base-spacing change",
        async () => {
          await navigate({ inset: 48 });
          await page.evaluate(`(() => {
          const area = document.querySelector('form[aria-label="메시지 입력 영역"]').parentElement;
          area.style.paddingTop = '14px';
          dispatchEvent(new Event('resize'));
        })()`);
          await settle();
          const updated = await measure();
          assert.equal(updated.paddingTop, 14);
          assert.equal(updated.paddingBottom, 14);
        },
      );

      await t.test(
        "mobile exit and SPA cleanup release observers and composer corrections",
        async () => {
          await navigate({ inset: 48 });
          assert.ok(
            await page.evaluate(
              "!!window.__gachigachaAndroidChatScrollObservation",
            ),
          );
          await size(1024, 820);
          await settle();
          assert.equal(
            await page.evaluate(
              "window.__gachigachaAndroidChatScrollObservation",
            ),
            null,
          );
          const desktop = await measure();
          assert.equal(
            desktop.paddingTop,
            12,
            "real web desktop composer spacing",
          );
          assert.equal(
            desktop.paddingBottom,
            12,
            "mobile correction is inactive on desktop",
          );
          await size(393, 820);
          await settle();
          await pinBottom();
          await assertPinned("return to mobile");
          await page.evaluate("window.chatFixture.close()");
          await settle();
          assert.equal(
            await page.evaluate(
              "window.__gachigachaAndroidChatScrollObservation",
            ),
            null,
          );
          assert.equal(
            await page.evaluate(
              "document.querySelectorAll('[data-gachigacha-android-chat-main], [data-gachigacha-android-chat-drawer], [data-gachigacha-android-chat-composer-area]').length",
            ),
            0,
          );
        },
      );
    } finally {
      page?.close();
      browser.kill("SIGTERM");
      await new Promise((resolveExit) => {
        if (browser.exitCode !== null) return resolveExit();
        browser.once("exit", resolveExit);
        setTimeout(() => {
          browser.kill("SIGKILL");
          resolveExit();
        }, 3000).unref();
      });
      server.closeAllConnections();
      await new Promise((resolveClose) => server.close(resolveClose));
      await rm(profile, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  },
);
