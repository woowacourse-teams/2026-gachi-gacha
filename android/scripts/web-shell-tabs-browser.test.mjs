import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createWebShellRuntimeScript } from "../src/domains/webShell/webShellPolicy.ts";
import { connectPage } from "./browser-test-cdp.mjs";

const chromePath =
  process.env.ANDROID_TEST_CHROME ||
  ["/usr/bin/chromium", "/usr/bin/google-chrome"].find(existsSync);
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
  // Extract only exact styled declarations, without importing route auth/API
  // hooks. Fail on a changed declaration instead of silently testing stale CSS.
  const declarations = [];
  for (const [path, original, exported] of [
    ["routes/trade/TradePage.tsx", "Page", "TradePage"],
    ["routes/trade/TradePage.tsx", "Main", "TradeMain"],
    ["routes/chat/ChatPage.tsx", "Page", "ChatPage"],
    ["routes/mypage/MyPageLayout.tsx", "Page", "MyPage"],
  ]) {
    const source = await readFile(join(webSource, "src", path), "utf8");
    const declaration = source.match(
      new RegExp(`^const ${original} = styled[\\s\\S]+?^\x60;`, "m"),
    )?.[0];
    assert.ok(declaration, `Real web declaration exists: ${path} ${original}`);
    declarations.push(
      declaration.replace(`const ${original}`, `export const ${exported}`),
    );
  }
  const pageStyles = `import styled from '@emotion/styled';\nimport {color,breakpoint} from '@/shared/styles/tokens';\n${declarations.join("\n")}`;
  const aliases = {
    "gachi-web-global-styles": "shared/ui/GlobalStyles.tsx",
    "gachi-web-header-styles": "shared/ui/AppHeader.styles.ts",
    "gachi-web-footer": "shared/ui/SiteFooter.tsx",
    "gachi-web-create-trade":
      "routes/trade/components/CreateTradeButton/CreateTradeButton.tsx",
  };
  const bundle = await esbuild.build({
    entryPoints: [
      fileURLToPath(new URL("./fixtures/tabs.mjs", import.meta.url)),
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    nodePaths: [webModules],
    alias: {
      ...Object.fromEntries(
        Object.entries(aliases).map(([name, path]) => [
          name,
          join(webSource, "src", path),
        ]),
      ),
      "@": join(webSource, "src"),
      react: dirname(requireWeb.resolve("react/package.json")),
      "react-dom": dirname(requireWeb.resolve("react-dom/package.json")),
    },
    loader: { ".png": "dataurl", ".svg": "dataurl" },
    plugins: [
      {
        name: "network-free-tab-fixture",
        setup(build) {
          build.onResolve({ filter: /^gachi-web-tab-page-styles$/ }, () => ({
            path: "pages",
            namespace: "fixture",
          }));
          build.onResolve(
            { filter: /^@\/shared\/analytics\/analyticsClient$/ },
            () => ({ path: "analytics", namespace: "fixture" }),
          );
          build.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
            contents:
              args.path === "pages"
                ? pageStyles
                : "export function captureAnalyticsEvent() {}",
            loader: "tsx",
            resolveDir: webSource,
          }));
        },
      },
    ],
    define: { "process.env.NODE_ENV": '"production"' },
  });
  return bundle.outputFiles[0].text;
}

test(
  "Android common tabs, web footer and home action use the native-safe viewport",
  { timeout: 120000 },
  async (t) => {
    assert.ok(
      chromePath && existsSync(chromePath),
      "Set ANDROID_TEST_CHROME to installed Chromium",
    );
    const bundle = await buildFixture();
    const profile = await mkdtemp(join(tmpdir(), "gachi-tabs-browser-"));
    const server = createServer((request, response) => {
      const js = request.url === "/tabs-fixture.js";
      response.writeHead(200, {
        "Content-Type": js
          ? "text/javascript; charset=utf-8"
          : "text/html; charset=utf-8",
      });
      response.end(
        js
          ? bundle
          : '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/tabs-fixture.js"></script></body></html>',
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
          "new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(resolve,80))))",
        );
      const size = (width, height = 820) =>
        page.send("Emulation.setDeviceMetricsOverride", {
          width,
          height,
          deviceScaleFactor: 1,
          mobile: true,
        });
      const navigate = async ({
        path = "/trade",
        width = 393,
        inset = 48,
        injected = true,
      } = {}) => {
        await size(width);
        await page.send("Emulation.setSafeAreaInsetsOverride", {
          insets: { top: 0, left: 0, right: 0, bottom: inset },
        });
        await page.send("Page.navigate", { url: origin + path });
        let ready = false;
        for (let attempt = 0; attempt < 100; attempt++) {
          ready = await page.evaluate(
            `location.href===${JSON.stringify(origin + path)} && document.readyState==='complete' && !!window.tabsFixture`,
          );
          if (ready) break;
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
        }
        assert.ok(ready, `Loaded real web components at ${path}`);
        if (injected) await page.evaluate(runtimeScript);
        await settle();
      };
      const geometry = () =>
        page.evaluate(`(() => {
      const nav=document.querySelector('nav[aria-label="하단 메뉴"]');
      const fab=document.querySelector('a[href="/trade/new"][data-placement="mobile"]');
      const page=document.querySelector('[data-fixture-page]');
      const content=location.pathname==='/trade' ? page.querySelector('main') : page;
      const footer=document.getElementById('site-footer');
      const rect=element=>{if(!element)return null;const r=element.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right}};
      return {path:location.pathname,width:innerWidth,height:innerHeight,nav:rect(nav),fab:rect(fab),
        navPadding:parseFloat(getComputedStyle(nav).paddingBottom),navDisplay:getComputedStyle(nav).display,
        navMarked:nav.hasAttribute('data-gachigacha-android-tabs'),
        fabMarked:fab?.hasAttribute('data-gachigacha-android-create-trade')||false,
        contentPadding:parseFloat(getComputedStyle(content).paddingBottom),
        contentMarked:content.hasAttribute('data-gachigacha-android-tab-content'),
        footerDisplay:footer?getComputedStyle(footer).display:null,
        contentFooterDisplay:getComputedStyle(document.getElementById('content-footer')).display,
        overflow:document.documentElement.scrollWidth>innerWidth,
        fabOriginalOverlap:fab?.style.getPropertyValue('--site-footer-overlap')||null};
    })()`);
      const assertMobile = async () => {
        const g = await geometry();
        assert.equal(g.navPadding, 0, JSON.stringify(g));
        assert.equal(g.navMarked, true);
        assert.ok(Math.abs(g.nav.bottom - g.height) <= 1, JSON.stringify(g));
        assert.notEqual(
          g.contentFooterDisplay,
          "none",
          "Only global site footer is hidden",
        );
        assert.equal(g.overflow, false);
        assert.equal(g.contentMarked, true);
        assert.equal(
          g.contentPadding,
          Math.ceil(g.nav.height + (g.fab ? g.fab.height + 32 : 0)),
          JSON.stringify(g),
        );
        if (g.footerDisplay) assert.equal(g.footerDisplay, "none");
        if (g.fab) {
          assert.equal(g.fabMarked, true);
          assert.ok(
            Math.abs(g.nav.top - g.fab.bottom - 16) <= 1,
            JSON.stringify(g),
          );
        }
        return g;
      };
      const screenshot = async (name) => {
        if (!process.env.ANDROID_TEST_SCREENSHOT_DIR) return;
        await mkdir(process.env.ANDROID_TEST_SCREENSHOT_DIR, {
          recursive: true,
        });
        const { data } = await page.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: false,
        });
        await writeFile(
          join(process.env.ANDROID_TEST_SCREENSHOT_DIR, name + ".png"),
          Buffer.from(data, "base64"),
        );
      };
      await t.test(
        "uninjected web preserves safe-area, footer and footer-avoiding FAB",
        async () => {
          await navigate({ injected: false });
          const before = await geometry();
          assert.equal(before.navPadding, 48);
          assert.equal(before.footerDisplay, "flex");
          assert.equal(before.navMarked, false);
          assert.equal(before.contentMarked, false);
          await page.evaluate(
            "window.scrollTo(0,document.documentElement.scrollHeight)",
          );
          await settle();
          const bottom = await geometry();
          assert.ok(
            bottom.fab.bottom < before.fab.bottom - 50,
            "Actual web footer hook reproduces the floating-action regression",
          );
        },
      );
      for (const path of ["/trade", "/chat", "/mypage"]) {
        for (const width of [320, 393, 767]) {
          for (const inset of [0, 48]) {
            await t.test(
              `${path} ${width}px safe-area ${inset}px`,
              async () => {
                await navigate({ path, width, inset });
                await assertMobile();
                if (path === "/trade" && width === 393 && inset === 48)
                  await screenshot("android-home-393-inset48");
              },
            );
          }
        }
      }
      await t.test(
        "home action remains attached at document bottom despite the real footer hook",
        async () => {
          await navigate();
          const before = await assertMobile();
          await page.evaluate(
            "window.scrollTo(0,document.documentElement.scrollHeight)",
          );
          await settle();
          const bottom = await assertMobile();
          assert.deepEqual(bottom.fab, before.fab);
          assert.equal(
            bottom.fabOriginalOverlap,
            "820px",
            "The real web hook is active; adapter does not rewrite React-owned inline data",
          );
          await screenshot("android-home-bottom-393-inset48");
        },
      );
      await t.test(
        "nav and action size changes are observed without window resize",
        async () => {
          await navigate();
          await page.evaluate(`window.fixtureResizeCount=0;window.addEventListener('resize',()=>window.fixtureResizeCount++);
        document.querySelector('[data-fixture-page]').style.setProperty('--trade-mobile-tab-height','88px');
        document.querySelector('a[data-placement=mobile]').style.height='72px';`);
          await settle();
          const g = await assertMobile();
          assert.equal(g.nav.height, 89);
          assert.equal(g.fab.height, 72);
          assert.equal(await page.evaluate("window.fixtureResizeCount"), 0);
        },
      );
      await t.test(
        "SPA tab changes preserve route-specific content padding and links",
        async () => {
          await navigate();
          for (const path of ["/chat", "/mypage", "/trade"]) {
            await page.evaluate(
              `document.querySelector('nav[aria-label="하단 메뉴"] a[href="${path}"]').click()`,
            );
            await settle();
            assert.equal((await assertMobile()).path, path);
          }
        },
      );
      await t.test(
        "tablet restores web layout overrides while Android site footer stays hidden",
        async () => {
          for (const path of ["/trade", "/mypage"]) {
            await navigate({ path });
            await assertMobile();
            await size(768);
            await settle();
            const tablet = await geometry();
            assert.equal(tablet.navDisplay, "none");
            assert.equal(tablet.navMarked, false);
            assert.equal(tablet.fabMarked, false);
            assert.equal(tablet.contentMarked, false);
            assert.equal(tablet.contentPadding, path === "/trade" ? 64 : 104);
            assert.equal(tablet.footerDisplay, "none");
            await size(393);
            await settle();
            await assertMobile();
          }
        },
      );
      await t.test(
        "reinjecting adapter is idempotent and keeps a single stylesheet",
        async () => {
          await navigate();
          const before = await assertMobile();
          await page.evaluate(runtimeScript);
          await page.evaluate(runtimeScript);
          await settle();
          assert.deepEqual(await assertMobile(), before);
          assert.equal(
            await page.evaluate(
              'document.querySelectorAll("#gachigacha-android-webview-style").length',
            ),
            1,
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
