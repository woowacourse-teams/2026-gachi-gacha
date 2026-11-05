import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createWebShellRuntimeScript } from '../src/domains/webShell/webShellPolicy.ts';

const chromePath = process.env.ANDROID_TEST_CHROME ||
  ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(existsSync);
const webSource = resolve(process.env.ANDROID_TEST_FRONTEND_SOURCE ||
  fileURLToPath(new URL('../../frontend', import.meta.url)));
const webModules = resolve(process.env.ANDROID_TEST_FRONTEND_NODE_MODULES || join(webSource, 'node_modules'));
const runtimeFactory = process.env.ANDROID_TEST_RUNTIME_MODULE
  ? (await import(pathToFileURL(process.env.ANDROID_TEST_RUNTIME_MODULE).href)).createWebShellRuntimeScript
  : createWebShellRuntimeScript;
const runtimeScript = runtimeFactory();
const photoListSelector = '[role="list"][aria-label="등록할 거래 사진"]';
const photoSelector = '[data-trade-photo-index]';
const handleSelector = '[data-gachigacha-android-photo-handle]';
const originalNames = ['alpha.png', 'bravo.png', 'charlie.png', 'delta.png', 'echo.png'];

async function buildFixture() {
  const requireWeb = createRequire(join(webModules, '../package.json'));
  let esbuild;
  try { esbuild = requireWeb('esbuild'); }
  catch {
    try { esbuild = requireWeb(join(webModules, '.pnpm/node_modules/esbuild')); }
    catch { throw new Error('Set ANDROID_TEST_FRONTEND_NODE_MODULES to the installed web dependencies.'); }
  }
  const component = name => join(webSource, 'src/routes/tradeCreate/components', name, `${name}.tsx`);
  for (const name of ['PhotoUploader', 'StickyActionBar']) {
    assert.ok(existsSync(component(name)), `Set ANDROID_TEST_FRONTEND_SOURCE to the current web frontend directory (${name}).`);
  }
  const bundle = await esbuild.build({
    entryPoints: [fileURLToPath(new URL('./fixtures/trade-form.mjs', import.meta.url))],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    nodePaths: [webModules],
    alias: {
      'gachi-web-photo-uploader': component('PhotoUploader'),
      'gachi-web-sticky-action-bar': component('StickyActionBar'),
      '@': join(webSource, 'src'),
      react: dirname(requireWeb.resolve('react/package.json')),
      'react-dom': dirname(requireWeb.resolve('react-dom/package.json')),
    },
    plugins: [{
      name: 'network-free-analytics',
      setup(build) {
        build.onResolve({ filter: /^@\/shared\/analytics\/analyticsClient$/ }, () => ({ path: 'analytics', namespace: 'fixture' }));
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
          contents: 'export function captureAnalyticsEvent(name, properties) { window.tradeAnalytics.push({ name, properties }); }',
          loader: 'js',
        }));
      },
    }],
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  return bundle.outputFiles[0].text;
}

// Mirrors TradeCreatePage/TradeEditPage's layout, not the components under test.
const documentHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: sans-serif; }
  button, input, textarea { font: inherit; }
  .app-header { height: 56px; padding: 16px; }
  .trade-page { display: flex; min-height: 100dvh; padding-bottom: 85px; flex-direction: column; background: white; }
  .trade-main { width: min(100%,960px); margin: 0 auto; padding: 48px 24px 72px; flex: 1; }
  .trade-main h1 { margin: 0 0 28px; font-size: 28px; }
  .trade-main form { display: flex; gap: 28px; flex-direction: column; }
  .trade-main label { display: flex; gap: 10px; flex-direction: column; }
  input, textarea { width: 100%; min-height: 52px; padding: 12px; }
  .long-content { height: 900px; }
  #unrelatedFooter { padding: 9px 13px; background: rgb(240 240 240); }
  @media(max-width:680px) { .trade-main { padding: 32px 16px 48px; } }
</style></head><body><div id="root"></div><script src="/trade-fixture.js"></script></body></html>`;

async function connectPage(browser) {
  const address = await new Promise((resolveAddress, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Chromium startup timeout: ${output}`)), 10000);
    browser.stderr.on('data', chunk => {
      output += chunk;
      const match = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(output);
      if (match) { clearTimeout(timer); resolveAddress(`http://127.0.0.1:${match[1]}`); }
    });
    browser.once('error', error => { clearTimeout(timer); reject(error); });
    browser.once('exit', code => { clearTimeout(timer); reject(new Error(`Chromium exited ${code}`)); });
  });
  let target;
  for (let attempt = 0; attempt < 100 && !target; attempt++) {
    const targets = await (await fetch(`${address}/json`)).json();
    target = targets.find(item => item.type === 'page');
    if (!target) await new Promise(resolveDelay => setTimeout(resolveDelay, 20));
  }
  assert.ok(target, 'Chromium exposes a test page');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timer);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolveMessage, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve: resolveMessage, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  return { send, evaluate, close: () => socket.close() };
}

test('Android trade form uses the real web upload and action components', { timeout: 120000 }, async t => {
  assert.ok(chromePath && existsSync(chromePath), 'Set ANDROID_TEST_CHROME to an installed Chromium.');
  const bundle = await buildFixture();
  const temporaryProfile = await mkdtemp(join(tmpdir(), 'gachi-trade-form-browser-'));
  const server = createServer((request, response) => {
    if (new URL(request.url, 'http://localhost').pathname === '/trade-fixture.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
      response.end(bundle);
      return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(documentHtml);
  });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = spawn(chromePath, [
    '--headless', '--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-background-networking',
    '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${temporaryProfile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let page;
  try {
    page = await connectPage(browser);
    const settle = () => page.evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 40))))');
    const size = (width, height = 820) => page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    const inject = async () => { await page.evaluate(runtimeScript); await settle(); };
    const navigate = async (path, width = 393, injectRuntime = true) => {
      await size(width);
      await page.send('Page.navigate', { url: `${origin}${path}` });
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        ready = await page.evaluate(`location.href === ${JSON.stringify(origin + path)} && document.readyState === 'complete' && !!window.tradeFixture`);
        if (ready) break;
        await new Promise(resolveDelay => setTimeout(resolveDelay, 20));
      }
      assert.ok(ready, `React trade fixture loaded at ${path}`);
      if (injectRuntime) await inject();
      await settle();
    };
    const center = selector => page.evaluate(`(() => { const element=document.querySelector(${JSON.stringify(selector)}); if(!element) return null; const r=element.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
    const touch = async (start, end = start, holdMilliseconds = 0) => {
      assert.ok(start && end, 'Touch targets must exist');
      const point = (x, y) => ({ x, y, id: 1, radiusX: 2, radiusY: 2, force: 1 });
      await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(start.x, start.y)] });
      if (holdMilliseconds > 0) await new Promise(resolveDelay => setTimeout(resolveDelay, holdMilliseconds));
      if (start.x !== end.x || start.y !== end.y) {
        for (let step = 1; step <= 12; step++) {
          await page.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(start.x+(end.x-start.x)*step/12, start.y+(end.y-start.y)*step/12)] });
          await new Promise(resolveDelay => setTimeout(resolveDelay, 16));
        }
      }
      await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await settle();
    };
    const names = () => page.evaluate('window.tradeFixture.names');
    const screenshot = async name => {
      const directory = process.env.ANDROID_TEST_SCREENSHOT_DIR;
      if (!directory) return;
      await mkdir(directory, { recursive: true });
      const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(join(directory, `${name}.png`), Buffer.from(data, 'base64'));
    };
    const actionGeometry = () => page.evaluate(`(() => {
      const button=document.querySelector('button[type="submit"][form]');
      const bar=button.closest('footer'); const b=button.getBoundingClientRect();
      const r=bar.getBoundingClientRect(); const css=getComputedStyle(bar);
      return {left:b.left,right:innerWidth-b.right,bottom:innerHeight-b.bottom,barBottom:r.bottom,viewport:innerHeight,
        paddingBottom:parseFloat(css.paddingBottom),marked:bar.hasAttribute('data-gachigacha-android-trade-action-bar'),
        form:button.form?.id,disabled:button.disabled};
    })()`);

    for (const route of ['/trade/new', '/trade/42/edit']) {
      for (const width of [320, 360, 393, 412]) {
        await t.test(`${route} ${width}px has equal action margins before and after viewport resizing`, async () => {
          await navigate(route, width);
          const assertMargins = async () => {
            const geometry = await actionGeometry();
            assert.ok(geometry.marked, 'Only the matching trade submit footer is marked');
            assert.ok(Math.abs(geometry.left-geometry.right) <= 1, JSON.stringify(geometry));
            assert.ok(Math.abs(geometry.bottom-geometry.left) <= 1, JSON.stringify(geometry));
            assert.ok(Math.abs(geometry.barBottom-geometry.viewport) <= 1, 'Bar stays within the already-safe WebView viewport');
            assert.ok(geometry.bottom >= 16, 'Content gap is retained without adding the native inset twice');
            assert.equal(geometry.form, route.endsWith('/edit') ? 'trade-edit-form' : 'trade-create-form');
          };
          await assertMargins();
          if (route === '/trade/new' && (width === 320 || width === 393)) {
            await screenshot(`android-trade-form-${width}`);
          }
          await page.evaluate('document.getElementById("tradeTitle").focus()');
          await size(width, 430);
          await settle();
          await assertMargins();
          await page.evaluate('document.activeElement.blur()');
          await size(width);
          await inject();
          await assertMargins();
          assert.equal(await page.evaluate('document.querySelectorAll("[data-gachigacha-android-trade-action-bar]").length'), 1);
          assert.equal(await page.evaluate('getComputedStyle(document.getElementById("unrelatedFooter")).paddingBottom'), '9px');
          assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
        });
      }
    }

    await t.test('keyboard reordering, deletion and native form submission preserve the React draft', async () => {
      await navigate('/trade/new');
      await page.evaluate(`document.querySelector(${JSON.stringify(photoSelector)}).focus()`);
      await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      await settle();
      assert.deepEqual(await names(), ['bravo.png', 'alpha.png', 'charlie.png', 'delta.png', 'echo.png']);
      await touch(await center('button[aria-label="거래 사진 1 삭제"]'));
      assert.deepEqual(await names(), ['alpha.png', 'charlie.png', 'delta.png', 'echo.png']);
      assert.equal(await page.evaluate('window.tradeFixture.title'), '유지할 거래 초안');
      await touch(await center('button[type="submit"][form="trade-create-form"]'));
      assert.deepEqual(await page.evaluate('window.tradeSubmissions'), [{
        names: ['alpha.png', 'charlie.png', 'delta.png', 'echo.png'], title: '유지할 거래 초안', formId: 'trade-create-form',
      }]);
      await page.evaluate('window.tradeFixture.setSubmitting(true)');
      await settle();
      assert.equal((await actionGeometry()).disabled, true, 'Submitting state stays owned by the real React component');
    });

    for (const width of [320, 360, 393, 412]) {
      await t.test(`${width}px trusted photo-body swipes scroll without reordering and separate handles reorder`, async () => {
        await navigate('/trade/new', width);
        assert.equal(await page.evaluate(`document.querySelectorAll(${JSON.stringify(handleSelector)}).length`), 5);
        const layout = await page.evaluate(`(() => {
          const list=document.querySelector(${JSON.stringify(photoListSelector)}), r=list.getBoundingClientRect();
          const item=list.querySelector(${JSON.stringify(photoSelector)}), image=item.querySelector('img'), handle=item.querySelector(${JSON.stringify(handleSelector)});
          const p=item.getBoundingClientRect(), i=image.getBoundingClientRect(), h=handle.getBoundingClientRect();
          return {left:r.left,right:r.right,top:r.top,width:r.width,cardWidth:p.width,imageBottom:i.bottom,handleTop:h.top,handleHeight:h.height};
        })()`);
        assert.ok(layout.cardWidth <= (layout.width-16)/3+1, `Three slots fit: ${JSON.stringify(layout)}`);
        assert.ok(layout.handleTop >= layout.imageBottom-1, 'The reorder handle owns a separate row, not a photo overlay');
        assert.ok(layout.handleHeight >= 36, 'The touch handle has a usable target height');
        await touch({ x: layout.right-24, y: layout.top+40 }, { x: layout.left+24, y: layout.top+40 });
        await page.evaluate('new Promise(resolve => setTimeout(resolve, 180))');
        assert.deepEqual(await names(), originalNames, 'Swiping photo content never changes React File order');
        assert.ok(await page.evaluate(`document.querySelector(${JSON.stringify(photoListSelector)}).scrollLeft > 25`), 'A real touch gesture advances the horizontal scroller');
        assert.ok(await page.evaluate('window.tradePointerEvents.some(event=>event.pointerType==="touch" && event.type==="pointerdown" && event.trusted)'), 'CDP generated trusted browser touch input');
        assert.equal(await page.evaluate('window.tradeAnalytics.filter(event=>event.name==="trade_photo_reordered").length'), 0);

        await page.evaluate(`document.querySelector(${JSON.stringify(photoListSelector)}).scrollLeft=0; scrollTo(0,0)`);
        await settle();
        const firstHandle = await center(`${photoSelector}[data-trade-photo-index="0"] ${handleSelector}`);
        const secondHandle = await center(`${photoSelector}[data-trade-photo-index="1"] ${handleSelector}`);
        await touch(firstHandle, secondHandle);
        assert.deepEqual(await names(), ['bravo.png', 'alpha.png', 'charlie.png', 'delta.png', 'echo.png']);
        assert.equal(await page.evaluate('window.tradeAnalytics.filter(event=>event.name==="trade_photo_reordered" && event.properties.method==="drag").length'), 1);
        assert.equal(await page.evaluate('window.tradeFixture.title'), '유지할 거래 초안');
        assert.equal(await page.evaluate(`document.querySelectorAll(${JSON.stringify(handleSelector)}).length`), 5, 'React reorder does not duplicate or orphan handles');
      });
    }

    await t.test('0/1/2/5 photo transitions and real deletion clean up only reorder handles', async () => {
      await navigate('/trade/new');
      for (const count of [0, 1, 2, 5]) {
        await page.evaluate(`window.tradeFixture.setPhotoCount(${count})`);
        await settle();
        await inject();
        assert.equal((await names()).length, count);
        assert.equal(await page.evaluate(`document.querySelectorAll(${JSON.stringify(handleSelector)}).length`), count > 1 ? count : 0);
        assert.equal(await page.evaluate(`document.querySelectorAll('[data-gachigacha-android-trade-photos]').length`), 1);
      }
      for (let count = 5; count > 0; count--) {
        await page.evaluate(`document.querySelector(${JSON.stringify(photoListSelector)}).scrollLeft=0; scrollTo(0,0)`);
        await settle();
        await touch(await center('button[aria-label="거래 사진 1 삭제"]'));
        assert.equal((await names()).length, count-1);
        assert.equal(await page.evaluate(`document.querySelectorAll(${JSON.stringify(handleSelector)}).length`), count-1 > 1 ? count-1 : 0);
      }
      assert.equal(await page.evaluate('window.tradeFixture.title'), '유지할 거래 초안');
      assert.equal(await page.evaluate('window.tradeSubmissions.length'), 0, 'Deleting photos never submits the form');
    });

    await t.test('long-pressing a photo body cannot start HTML drag-and-drop reordering', async () => {
      await navigate('/trade/new', 393);
      const first = await center(`${photoSelector}[data-trade-photo-index="0"] img`);
      const second = await center(`${photoSelector}[data-trade-photo-index="1"] img`);
      await touch(first, second, 750);
      assert.deepEqual(await names(), originalNames, 'A 750ms body hold followed by a horizontal drag must not reorder Files');
      assert.deepEqual(await page.evaluate('window.tradeDragEvents'), [], 'A body long press must not activate native HTML drag-and-drop');
      assert.equal(await page.evaluate('window.tradeAnalytics.filter(event=>event.name==="trade_photo_reordered").length'), 0);
      assert.ok(await page.evaluate('window.tradePointerEvents.some(event=>event.pointerType==="touch" && event.trusted)'), 'Long-press input is trusted Chromium input');
    });

    await t.test('existing edit photos scroll but do not receive unsupported reorder handles', async () => {
      await navigate('/trade/42/edit?existing=1', 320);
      assert.equal(await page.evaluate(`document.querySelectorAll(${JSON.stringify(handleSelector)}).length`), 0);
      assert.equal(await page.evaluate(`document.querySelectorAll(${JSON.stringify(photoListSelector+' img')}).length`), 5);
      const row = await page.evaluate(`(() => { const r=document.querySelector(${JSON.stringify(photoListSelector)}).getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top}; })()`);
      await touch({ x: row.right-24, y: row.top+40 }, { x: row.left+24, y: row.top+40 });
      assert.ok(await page.evaluate(`document.querySelector(${JSON.stringify(photoListSelector)}).scrollLeft > 25`));
      assert.deepEqual(await names(), []);
    });

    await t.test('photo-body vertical swipes and the last input remain reachable above the action bar', async () => {
      await navigate('/trade/new', 320);
      const photo = await center(`${photoSelector}[data-trade-photo-index="0"] img`);
      await touch(photo, { x: photo.x, y: Math.max(20, photo.y-110) });
      assert.ok(await page.evaluate('scrollY > 25'), 'Photo content also preserves normal vertical page scrolling');
      assert.deepEqual(await names(), originalNames);
      await size(320, 430);
      await page.evaluate('document.getElementById("lastTradeField").focus(); document.getElementById("lastTradeField").scrollIntoView({block:"center",behavior:"instant"})');
      await settle();
      assert.ok(await page.evaluate(`(() => {
        const field=document.getElementById('lastTradeField').getBoundingClientRect();
        const bar=document.querySelector('button[type="submit"][form]').closest('footer').getBoundingClientRect();
        return field.top >= 0 && field.bottom <= bar.top;
      })()`), 'The final editable field is not covered by the keyboard-resized action bar');
    });

    await t.test('SPA route and mobile breakpoint changes remove stale markers and grips', async () => {
      await navigate('/trade/new', 393);
      await page.evaluate('history.pushState({},"","/mypage"); window.dispatchEvent(new Event("resize"))');
      await settle();
      assert.equal(await page.evaluate('document.querySelectorAll("[data-gachigacha-android-trade-photos], [data-gachigacha-android-photo-handle], [data-gachigacha-android-trade-action-bar]").length'), 0);
      assert.equal((await actionGeometry()).paddingBottom, 16);
      await page.evaluate('history.pushState({},"","/trade/new"); window.dispatchEvent(new Event("resize"))');
      await settle();
      assert.equal(await page.evaluate(`document.querySelectorAll(${JSON.stringify(handleSelector)}).length`), 5);
      await size(768);
      await settle();
      assert.equal(await page.evaluate('document.querySelectorAll("[data-gachigacha-android-trade-photos], [data-gachigacha-android-photo-handle]").length'), 0);
      assert.equal((await actionGeometry()).paddingBottom, 16, 'Desktop-width layout stays web-owned');
      await size(767);
      await settle();
      assert.equal(await page.evaluate(`document.querySelectorAll(${JSON.stringify(handleSelector)}).length`), 5);
      assert.equal((await actionGeometry()).paddingBottom, 24);
      assert.deepEqual(await names(), originalNames);
    });

    await t.test('matching-looking components on another route are not adapted', async () => {
      await navigate('/mypage', 393, false);
      const before = await actionGeometry();
      await inject();
      assert.deepEqual(await actionGeometry(), before);
      assert.equal(await page.evaluate('document.querySelectorAll("[data-gachigacha-android-trade-photos], [data-gachigacha-android-photo-handle], [data-gachigacha-android-trade-action-bar]").length'), 0);
    });

  } finally {
    page?.close();
    browser.kill('SIGTERM');
    await new Promise(resolveExit => {
      if (browser.exitCode !== null) { resolveExit(); return; }
      browser.once('exit', resolveExit);
      setTimeout(() => { browser.kill('SIGKILL'); resolveExit(); }, 3000).unref();
    });
    server.closeAllConnections();
    await new Promise(resolveClose => server.close(resolveClose));
    await rm(temporaryProfile, { recursive: true, force: true });
  }
});
