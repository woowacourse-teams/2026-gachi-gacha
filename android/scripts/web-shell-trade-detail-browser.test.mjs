import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createWebShellRuntimeScript } from "../src/domains/webShell/webShellPolicy.ts";
import { connectPage } from "./browser-test-cdp.mjs";

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

async function buildFixture() {
  const requireWeb = createRequire(join(webModules, "../package.json"));
  let esbuild;
  try {
    esbuild = requireWeb("esbuild");
  } catch {
    esbuild = requireWeb(join(webModules, ".pnpm/node_modules/esbuild"));
  }
  const mocks = {
    "@/shared/ui/AppHeader": "export function AppHeader(){return null}",
    "@/features/affiliateCatalog/AffiliateCatalogSlot":
      "export function AffiliateCatalogSlot(){return null}",
    "@/features/memberSafety/UserSafetyMenu":
      "import React from 'react';export function UserSafetyMenu(){return React.createElement('button',{style:{width:44,height:44,flex:'0 0 auto'}},'...')}",
    "@/shared/analytics/analyticsClient":
      "export function captureAnalyticsEvent(){}",
    "@/domains/trade/components/TradeDeleteDialog":
      "export function TradeDeleteDialog(){return null}",
  };
  const result = await esbuild.build({
    entryPoints: [
      fileURLToPath(new URL("./fixtures/trade-detail.mjs", import.meta.url)),
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    nodePaths: [webModules],
    alias: {
      "@": join(webSource, "src"),
      "gachi-web-global-styles": join(
        webSource,
        "src/shared/ui/GlobalStyles.tsx",
      ),
      "gachi-web-trade-detail-page": join(
        webSource,
        "src/routes/tradeDetail/TradeDetailPage.tsx",
      ),
      "gachi-web-chat-page": join(webSource, "src/routes/chat/ChatPage.tsx"),
      react: dirname(requireWeb.resolve("react/package.json")),
      "react-dom": dirname(requireWeb.resolve("react-dom/package.json")),
    },
    plugins: [
      {
        name: "network-free-trade-detail",
        setup(build) {
          build.onResolve({ filter: /^@\// }, (args) =>
            mocks[args.path]
              ? { path: args.path, namespace: "fixture" }
              : undefined,
          );
          build.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
            contents: mocks[args.path],
            loader: "js",
          }));
        },
      },
    ],
    loader: { ".svg": "dataurl", ".png": "dataurl", ".jpg": "dataurl" },
    define: { "process.env.NODE_ENV": '"production"' },
  });
  return result.outputFiles[0].text;
}

test(
  "real trade detail CTA and modal stay inside the Android viewport",
  { skip: !chromePath },
  async (t) => {
    const bundle = await buildFixture();
    const server = createServer((request, response) => {
      response.setHeader(
        "Content-Type",
        request.url === "/fixture.js" ? "text/javascript" : "text/html",
      );
      response.end(
        request.url === "/fixture.js"
          ? bundle
          : '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>',
      );
    });
    await new Promise((resolveListen) =>
      server.listen(0, "127.0.0.1", resolveListen),
    );
    const origin = `http://127.0.0.1:${server.address().port}`;
    const profile = await mkdtemp("/tmp/gachi-trade-detail-browser-");
    const browser = spawn(
      chromePath,
      [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
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
          "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(r,80))))",
        );
      const navigate = async (width, injected = true) => {
        await page.send("Emulation.setDeviceMetricsOverride", {
          width,
          height: 820,
          deviceScaleFactor: 1,
          mobile: true,
        });
        await page.send("Emulation.setSafeAreaInsetsOverride", {
          insets: { top: 0, left: 0, right: 0, bottom: 48 },
        });
        await page.send("Page.navigate", { url: origin + "/trade/42" });
        let ready = false;
        for (let i = 0; i < 100; i++) {
          ready = await page.evaluate(
            `location.href===${JSON.stringify(origin + "/trade/42")}&&document.readyState==='complete'&&!!window.tradeDetailFixture`,
          );
          if (ready) break;
          await new Promise((r) => setTimeout(r, 20));
        }
        assert.ok(ready, "real detail page mounted");
        if (injected) await page.evaluate(createWebShellRuntimeScript());
        await settle();
      };
      const geometry = () =>
        page.evaluate(`(()=>{
      const button=document.querySelector('a[href="/chat/start/42"]')||Array.from(document.querySelectorAll('a')).find(a=>{const url=new URL(a.href);return url.pathname==='/login'&&url.searchParams.get('returnTo')==='/trade/42'})||document.querySelector('button[aria-expanded][aria-busy][aria-disabled]');
      const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,sw:e.scrollWidth,cw:e.clientWidth}};
      const selectors=['aside[role="dialog"]','form[aria-label="메시지 입력 영역"]','input[aria-label="메시지"]','button[aria-label="보내기"]'];
      const bar=button?.parentElement;
      const label=document.createRange();
      if(button)label.selectNodeContents(button);
      return {width:innerWidth,height:innerHeight,docWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,visualWidth:visualViewport?.width,visualScale:visualViewport?.scale,screenWidth:screen.width,button:rect(button),label:button?rect(label):null,bar:rect(bar),barPosition:bar?getComputedStyle(bar).position:null,padding:bar?{top:parseFloat(getComputedStyle(bar).paddingTop),bottom:parseFloat(getComputedStyle(bar).paddingBottom)}:null,chat:selectors.map(s=>rect(document.querySelector(s)))};
    })()`);
      const assertCta = async () => {
        const g = await geometry();
        assert.ok(g.button && g.bar, JSON.stringify(g));
        assert.ok(
          g.button.left >= -1 && g.button.right <= g.width + 1,
          JSON.stringify(g),
        );
        assert.ok(g.button.sw <= g.button.cw + 1, JSON.stringify(g));
        assert.ok(
          g.bar.left >= -1 && g.bar.right <= g.width + 1,
          JSON.stringify(g),
        );
        return g;
      };
      const assertPhysicalViewport = (geometry, width) => {
        // With mobile emulation, content overflow can enlarge innerWidth while
        // clientWidth/visualViewport still represent the physical phone screen.
        assert.equal(geometry.clientWidth, width, JSON.stringify(geometry));
        assert.equal(geometry.width, width, JSON.stringify(geometry));
        assert.equal(geometry.docWidth, width, JSON.stringify(geometry));
        assert.ok(geometry.button.right <= width + 1, JSON.stringify(geometry));
        assert.ok(
          Math.abs(geometry.button.left - 16) <= 1 &&
            Math.abs(width - geometry.button.right - 16) <= 1,
          `CTA keeps symmetric 16px horizontal margins: ${JSON.stringify(geometry)}`,
        );
        assert.ok(
          Math.abs(
            (geometry.label.left + geometry.label.right) / 2 - width / 2,
          ) <= 1,
          `CTA text is centered in the physical viewport: ${JSON.stringify(geometry)}`,
        );
      };
      if (process.env.ANDROID_TEST_DIAGNOSE_DETAIL) {
        for (const part of [
          false,
          "title",
          "description",
          "desired",
          "category",
          "nickname",
          "comment",
        ]) {
          await navigate(393);
          await page.evaluate(
            `window.tradeDetailFixture.setLong(${JSON.stringify(part)})`,
          );
          await settle();
          console.log(
            JSON.stringify({
              part,
              ...(await geometry()),
              offenders: await page.evaluate(
                `Array.from(document.querySelectorAll('main *')).filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,12).map(e=>({tag:e.tagName,text:e.textContent.slice(0,50),right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width,sw:e.scrollWidth,cw:e.clientWidth,whiteSpace:getComputedStyle(e).whiteSpace,overflowWrap:getComputedStyle(e).overflowWrap}))`,
              ),
            }),
          );
          if (part === "description") {
            await page.evaluate(
              `document.querySelector('main > article').style.overflowWrap='anywhere'`,
            );
            await settle();
            console.log(
              JSON.stringify({
                trial: "article overflow-wrap:anywhere",
                ...(await geometry()),
              }),
            );
          }
        }
        return;
      }
      await t.test(
        "negative control reproduces the mobile layout viewport expansion",
        async () => {
          await navigate(393, false);
          await page.evaluate(
            "window.tradeDetailFixture.setLong('description')",
          );
          await settle();
          const before = await geometry();
          assert.equal(before.clientWidth, 393);
          assert.ok(
            before.docWidth > before.clientWidth,
            JSON.stringify(before),
          );
          assert.ok(
            before.bar.width > before.clientWidth,
            JSON.stringify(before),
          );
          await page.evaluate(createWebShellRuntimeScript());
          await settle();
          assertPhysicalViewport(await assertCta(), 393);
        },
      );
      await t.test(
        "related screen-reader labels cannot widen the viewport and retain accessible names and scrolling",
        async () => {
          await navigate(393);
          // frontend-dev has these labels; main does not yet. Reproduce that
          // same hidden-label contract without modifying either web source.
          const labels = await page.evaluate(`(()=>{
            const cards=Array.from(document.querySelectorAll('a[data-home-card]'));
            let inserted=0;
            for(const card of cards){
              let hidden=Array.from(card.querySelectorAll('span')).filter(span=>{
                const style=getComputedStyle(span);
                return style.position==='absolute'&&style.width==='1px'&&style.height==='1px'&&style.clipPath==='inset(50%)';
              });
              if(!hidden.length){
                const label=document.createElement('span');
                label.textContent='교환글 제목: ';
                label.style.cssText='position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0';
                card.querySelector('h3').before(label);
                hidden=[label];
                inserted++;
              }
              hidden.forEach(label=>label.setAttribute('data-fixture-screen-reader-label',''));
            }
            return {cards:cards.length,inserted,count:document.querySelectorAll('[data-fixture-screen-reader-label]').length};
          })()`);
          assert.equal(labels.cards, 8, JSON.stringify(labels));
          assert.ok(labels.count >= labels.cards, JSON.stringify(labels));
          await settle();
          const accessibleNames = async () => {
            const { nodes } = await page.send("Accessibility.getFullAXTree");
            return nodes
              .filter(
                (node) =>
                  node.role?.value === "link" &&
                  node.name?.value.includes("교환글 제목:"),
              )
              .map((node) => node.name.value);
          };
          const beforeNames = await accessibleNames();
          assert.equal(beforeNames.length, labels.cards);
          const beforeText = await page.evaluate(
            `Array.from(document.querySelectorAll('[data-fixture-screen-reader-label]'),label=>label.textContent)`,
          );
          assertPhysicalViewport(await assertCta(), 393);

          // Disable only the shipped card-position correction. Keep wrapping,
          // CTA spacing and every real web style active for the negative control.
          const removed = await page.evaluate(`(()=>{
            const sheet=document.getElementById('gachigacha-android-webview-style').sheet;
            const removeRule=parent=>{
              for(let index=0;index<parent.cssRules.length;index++){
                const rule=parent.cssRules[index];
                if(rule.selectorText?.includes('[data-gachigacha-android-trade-detail] ~ section [data-home-card]')&&rule.style.position==='relative'){
                  window.fixtureRelatedCardRule={parent,index,cssText:rule.cssText};
                  parent.deleteRule(index);
                  return true;
                }
                if(rule.cssRules&&removeRule(rule))return true;
              }
              return false;
            };
            return removeRule(sheet);
          })()`);
          assert.equal(removed, true, "remove only the related-card CSS rule");
          await settle();
          const expanded = await geometry();
          assert.equal(expanded.clientWidth, 393);
          assert.ok(expanded.docWidth > 393, JSON.stringify(expanded));
          assert.ok(expanded.bar.width > 393, JSON.stringify(expanded));
          assert.ok(expanded.button.right > 393, JSON.stringify(expanded));
          assert.deepEqual(await accessibleNames(), beforeNames);

          await page.evaluate(`(()=>{
            const {parent,index,cssText}=window.fixtureRelatedCardRule;
            parent.insertRule(cssText,index);
            delete window.fixtureRelatedCardRule;
          })()`);
          await settle();
          assertPhysicalViewport(await assertCta(), 393);
          assert.deepEqual(await accessibleNames(), beforeNames);
          assert.deepEqual(
            await page.evaluate(
              `Array.from(document.querySelectorAll('[data-fixture-screen-reader-label]'),label=>label.textContent)`,
            ),
            beforeText,
          );
          const scrolled = await page.evaluate(`(()=>{
            const first=document.querySelector('a[href="/trade/100"]');
            const grid=first.parentElement;
            grid.scrollLeft=grid.scrollWidth;
            const last=document.querySelector('a[href="/trade/107"]');
            return {scrollLeft:grid.scrollLeft,scrollWidth:grid.scrollWidth,clientWidth:grid.clientWidth,overflowX:getComputedStyle(grid).overflowX,lastRight:last.getBoundingClientRect().right,gridRight:grid.getBoundingClientRect().right};
          })()`);
          assert.equal(scrolled.overflowX, "auto");
          assert.ok(scrolled.scrollWidth > scrolled.clientWidth);
          assert.ok(scrolled.scrollLeft > 0);
          assert.ok(scrolled.lastRight <= scrolled.gridRight + 1);
          assertPhysicalViewport(await assertCta(), 393);
          assert.deepEqual(await accessibleNames(), beforeNames);
        },
      );
      const webGeometries = new Map();
      for (const width of [320, 360, 393, 412, 767, 768]) {
        for (const injected of [false, true]) {
          await t.test(
            `${width}px ${injected ? "Android" : width < 768 ? "untouched web baseline (observed)" : "untouched web"} full page, long content and 200% text`,
            async () => {
              await navigate(width, injected);
              // The untouched dev web contains the known mobile label overflow.
              // Record it as a baseline; Android and tablet remain strict.
              const measure = injected || width >= 768 ? assertCta : geometry;
              const initial = await measure();
              if (injected || width >= 768) {
                assert.equal(initial.width, width, JSON.stringify(initial));
                assert.equal(initial.docWidth, width, JSON.stringify(initial));
              }
              if (injected && width < 768) {
                assertPhysicalViewport(initial, width);
                assert.equal(initial.padding.bottom, initial.padding.top);
                assert.equal(initial.padding.bottom, 16);
              }
              await page.evaluate("window.tradeDetailFixture.setLong(true)");
              await settle();
              const long = await measure();
              if (injected && width < 768) {
                assertPhysicalViewport(long, width);
              }
              // Scale each computed text size once (not recursively compounded),
              // retaining fixed image/icon dimensions and actual responsive CSS.
              await page.evaluate(
                `(()=>{const text=Array.from(document.querySelectorAll('body *')).filter(e=>Array.from(e.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()));const sizes=text.map(e=>parseFloat(getComputedStyle(e).fontSize));text.forEach((e,i)=>e.style.setProperty('font-size',sizes[i]*2+'px','important'));window.scrollTo(0,document.documentElement.scrollHeight)})()`,
              );
              await settle();
              const scaled = await measure();
              if (injected && width < 768) {
                assertPhysicalViewport(scaled, width);
              }
              if (!injected)
                webGeometries.set(width, { initial, long, scaled });
              else if (width >= 768) {
                assert.deepEqual(
                  { initial, long, scaled },
                  webGeometries.get(width),
                  "tablet styles are untouched",
                );
              }
            },
          );
        }
      }
      if (process.env.ANDROID_TEST_DETAIL_SCREENSHOTS) {
        const screenshotDirectory = await mkdtemp(
          "/tmp/gachi-trade-detail-regression-",
        );
        for (const injected of [false, true]) {
          await navigate(393, injected);
          await page.evaluate(
            "window.tradeDetailFixture.setLong('description')",
          );
          await settle();
          await page.evaluate(
            "window.scrollTo(0,document.documentElement.scrollHeight)",
          );
          await settle();
          const capture = await page.send("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: false,
          });
          await writeFile(
            join(
              screenshotDirectory,
              injected
                ? "after-android-wrap.png"
                : "before-mobile-overflow.png",
            ),
            Buffer.from(capture.data, "base64"),
          );
        }
        console.log(`Synthetic detail screenshots: ${screenshotDirectory}`);
      }
      for (const width of [320, 393, 767, 768]) {
        await t.test(
          `${width}px chat opens from real detail link without horizontal overflow`,
          async () => {
            await navigate(width);
            // The real router keeps detail as backgroundLocation while showing a
            // modal. A pathname-only fix would disappear exactly when chat opens.
            if (width < 768) {
              await page.evaluate("window.tradeDetailFixture.setLong(true)");
              await settle();
            }
            await page.evaluate(
              `document.querySelector('a[href="/chat/start/42"]').click()`,
            );
            await settle();
            const g = await geometry();
            for (const rect of g.chat)
              assert.ok(
                rect &&
                  rect.left >= -1 &&
                  rect.right <= g.width + 1 &&
                  rect.sw <= rect.cw + 1,
                JSON.stringify(g),
              );
            if (width < 768) assertPhysicalViewport(g, width);
            await page.evaluate(
              `document.querySelector('button[aria-label="채팅 닫기"]').click()`,
            );
            await settle();
            const closed = await assertCta();
            if (width < 768) assertPhysicalViewport(closed, width);
          },
        );
      }
      for (const width of [320, 393, 767]) {
        await t.test(
          `${width}px CTA stays fixed and equally padded at the top, middle and bottom`,
          async () => {
            await navigate(width);
            for (const progress of [0, 0.5, 1]) {
              await page.evaluate(
                `window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*${progress})`,
              );
              await settle();
              const scrolling = await page.evaluate(
                `({top:scrollY,max:document.documentElement.scrollHeight-innerHeight})`,
              );
              assert.ok(scrolling.max > 0, JSON.stringify(scrolling));
              assert.ok(
                Math.abs(scrolling.top - scrolling.max * progress) <= 1,
                `The page reached scroll progress ${progress}: ${JSON.stringify(scrolling)}`,
              );
              const fixed = await assertCta();
              assertPhysicalViewport(fixed, width);
              assert.equal(
                fixed.height,
                820,
                "overflow must not enlarge the fixed layout viewport height",
              );
              assert.equal(fixed.barPosition, "fixed");
              assert.deepEqual(fixed.padding, { top: 16, bottom: 16 });
              assert.ok(
                Math.abs(fixed.bar.bottom - fixed.height) <= 1,
                `CTA remains above the native system-bar boundary: ${JSON.stringify(fixed)}`,
              );
              assert.ok(fixed.button.top >= 0);
              assert.ok(fixed.button.bottom <= fixed.height - 15);
              assert.equal(
                await page.evaluate(`(()=>{
                  const button=document.querySelector('a[href="/chat/start/42"]');
                  const rect=button.getBoundingClientRect();
                  const target=document.elementFromPoint((rect.left+rect.right)/2,(rect.top+rect.bottom)/2);
                  return target===button||button.contains(target);
                })()`),
                true,
                `CTA remains tappable at scroll progress ${progress}`,
              );
            }
          },
        );
        await t.test(
          `${width}px related products and five gallery images remain browsable`,
          async () => {
            await navigate(width);
            await page.evaluate("window.tradeDetailFixture.setLong(true)");
            await settle();
            const related = await page.evaluate(
              `(()=>{const first=document.querySelector('a[href="/trade/100"]');const grid=first.parentElement;grid.scrollLeft=grid.scrollWidth;const last=document.querySelector('a[href="/trade/107"]');return {scrollLeft:grid.scrollLeft,overflowX:getComputedStyle(grid).overflowX,grid:grid.getBoundingClientRect().right,last:last.getBoundingClientRect().right}})()`,
            );
            assert.equal(related.overflowX, "auto", JSON.stringify(related));
            assert.ok(
              related.scrollLeft > 0 && related.last <= related.grid + 1,
              JSON.stringify(related),
            );
            for (let index = 0; index < 4; index++) {
              await page.evaluate(
                `document.querySelector('button[aria-label="다음 상품 사진"]').click()`,
              );
              await settle();
            }
            assert.equal(
              await page.evaluate(
                `document.querySelector('button[aria-label="다음 상품 사진"]').disabled`,
              ),
              true,
            );
            await page.evaluate(
              `document.querySelector('button[aria-label="이전 상품 사진"]').click()`,
            );
            await settle();
            assert.equal(
              await page.evaluate(
                `document.querySelector('button[aria-label="다음 상품 사진"]').disabled`,
              ),
              false,
            );
            assertPhysicalViewport(await assertCta(), width);
          },
        );
        await t.test(
          `${width}px guest CTA preserves login destination and matching vertical padding`,
          async () => {
            await navigate(width);
            await page.evaluate(
              "window.tradeDetailFixture.setLong(true);window.tradeDetailFixture.setAction('login')",
            );
            await settle();
            const guest = await assertCta();
            assertPhysicalViewport(guest, width);
            assert.deepEqual(guest.padding, { top: 16, bottom: 16 });
            await page.evaluate(
              `Array.from(document.querySelectorAll('a')).find(a=>new URL(a.href).pathname==='/login').click()`,
            );
            await settle();
            assert.deepEqual(
              await page.evaluate(
                `({path:location.pathname,returnTo:new URL(location.href).searchParams.get('returnTo')})`,
              ),
              { path: "/login", returnTo: "/trade/42" },
            );
          },
        );
        await t.test(
          `${width}px own-post status controls still open and update status`,
          async () => {
            await navigate(width);
            await page.evaluate(
              "window.tradeDetailFixture.setLong(true);window.tradeDetailFixture.setAction('edit')",
            );
            await settle();
            const owner = await assertCta();
            assertPhysicalViewport(owner, width);
            // This focused fix must not silently restyle the owner status bar.
            assert.deepEqual(owner.padding, { top: 10, bottom: 58 });
            await page.evaluate(
              `document.querySelector('button[aria-expanded][aria-busy][aria-disabled]').click()`,
            );
            await settle();
            const choices = await page.evaluate(
              `(()=>{const e=document.querySelector('[aria-label="교환 상태 선택"]');const r=e.getBoundingClientRect();return {left:r.left,right:r.right,count:e.querySelectorAll('button').length}})()`,
            );
            assert.equal(choices.count, 3);
            assert.ok(
              choices.left >= -1 && choices.right <= width + 1,
              JSON.stringify(choices),
            );
            await page.evaluate(
              `document.querySelector('[aria-label="교환 상태 선택"] button:not(:disabled)').click()`,
            );
            await settle();
            assert.equal(
              await page.evaluate("window.lastFixtureStatusChange"),
              "IN_PROGRESS",
            );
            assertPhysicalViewport(await assertCta(), width);
          },
        );
      }
    } finally {
      page?.close();
      const exited = new Promise((resolveExit) =>
        browser.once("exit", resolveExit),
      );
      browser.kill();
      await exited;
      await new Promise((resolveClose) => server.close(resolveClose));
      await rm(profile, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  },
);
