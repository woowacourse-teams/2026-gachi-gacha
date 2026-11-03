import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { createWebShellRuntimeScript } from '../src/domains/webShell/webShellPolicy.ts';

// No browser package dependency: use an installed Chromium through its CDP API.
// The fixtures preserve the relevant DOM and CSS from web main/frontend-dev:
// AppHeader.styles, mypage/route.styles, AccountDialog.styles, TradeComments,
// ConversationList, ChatPage and ChatRoomPanel (2026-11-03). They deliberately
// include direct fixed-size <img>s as well as full-size images inside frames.
// Comparing the untouched-web geometry catches the original 100% avatar bug.
const chromePath = process.env.ANDROID_TEST_CHROME ||
  ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
    .find(existsSync);
// Optional baseline worktree module proves this suite detects a regression.
const runtimeFactory = process.env.ANDROID_TEST_RUNTIME_MODULE
  ? (await import(pathToFileURL(process.env.ANDROID_TEST_RUNTIME_MODULE).href)).createWebShellRuntimeScript
  : createWebShellRuntimeScript;
const runtimeScript = runtimeFactory();
const widths = [320, 360, 393, 412, 768];
const validPhoto = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="blue"/></svg>',
);

const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: sans-serif; }
  button, input { font: inherit; }
  .app-header { height: 90px; padding: 12px; background: white; }
  .account { display: inline-flex; height: 36px; padding: 0 9px; align-items: center; border: 1px solid #ddd; border-radius: 999px; }
  .header-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
  .mypage { width: min(100% - 24px, 1180px); margin: auto; }
  .profile-card { padding: 24px; border: 1px solid #f3cbd2; border-radius: 24px; background: #fff3f6; }
  .identity { display: flex; align-items: center; gap: 16px; }
  .identity > div:last-child { min-width: 0; }
  .identity h2 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-avatar { display: grid; width: 72px; height: 72px; flex: 0 0 72px; border-radius: 50%; place-items: center; object-fit: cover; }
  .profile-card > button { display: flex; width: 100%; min-height: 44px; margin-top: 20px; }
  .profile-dialog { display: block; position: relative; width: 100%; margin: 20px 0; padding: 16px; border: 1px solid #eee; }
  .photo-editor { display: flex; align-items: center; gap: 16px; }
  .edit-avatar { display: grid; width: 80px; height: 80px; flex: 0 0 80px; border-radius: 50%; border: 1px solid #ddd; object-fit: cover; place-items: center; }
  .photo-actions { display: grid; min-width: 0; }
  .photo-actions input { position: absolute; width: 1px; height: 1px; opacity: 0; }
  .conversation-panel { min-width: 0; background: white; }
  .conversation-panel > header { display: flex; padding: 28px 28px 20px; align-items: center; gap: 8px; }
  .conversation-panel h1 { margin: 0; font-size: 24px; }
  .notice { margin: 20px; padding: 18px; border-radius: 14px; background: #f4fbf9; }
  .list { display: grid; }
  .conversation { display: flex; min-width: 0; padding: 20px; align-items: center; gap: 14px; border: 0; border-bottom: 1px solid #eee; background: white; text-align: left; }
  .conversation > div:nth-child(2) { min-width: 0; flex: 1; }
  .conversation strong { white-space: nowrap; }
  .conversation p { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .chat-avatar { display: grid; width: 48px; height: 48px; overflow: hidden; flex: 0 0 auto; place-items: center; border-radius: 50%; background: #fce9ef; }
  .chat-avatar img { display: block; width: 100%; height: 100%; max-width: 100%; border-radius: inherit; object-fit: cover; }
  .comment-row { display: flex; gap: 12px; margin: 20px 0; }
  .comment-avatar { display: grid; width: 44px; height: 44px; overflow: hidden; place-items: center; border: 1px solid #ddd; border-radius: 50%; }
  .comment-avatar img { width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 520px) { .comment-avatar { width: 36px; height: 36px; } }
  .chat-main { display: grid; width: min(100%,1320px); min-height: 680px; margin: 36px auto 64px; overflow: hidden; grid-template-columns: 430px minmax(0,1fr); border: 1px solid #eee; border-radius: 22px; }
  .room { display: grid; height: 100%; min-width: 0; min-height: 680px; grid-template-rows: auto auto minmax(0,1fr) auto; }
  .room > header { display: flex; align-items: center; gap: 14px; min-height: 68px; padding: 12px; }
  .product { padding: 12px; min-height: 70px; }
  .messages { display: flex; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 28px 24px; flex-direction: column; gap: 12px; }
  .message { flex: 0 0 auto; min-height: 44px; padding: 12px; background: #f9f6f7; }
  .composer-area { position: relative; padding: 12px 20px 16px; }
  .composer { display: flex; min-height: 48px; padding: 0 8px 0 18px; align-items: center; gap: 12px; border: 1px solid #eee; border-radius: 999px; }
  .composer input { min-width: 0; flex: 1; border: 0; }
  .composer button { padding: 8px 12px; border: 0; border-radius: 999px; }
  @media (max-width: 900px) {
    .chat-main { width: calc(100% - 32px); grid-template-columns: 1fr; }
    .chat-main > .room { display: none; min-height: 0; }
    .chat-main.open { width: 100%; min-height: 0; height: 100dvh; margin: 0; border: 0; border-radius: 0; }
    .chat-main.open > aside { display: none; }
    .chat-main.open > .room { display: grid; }
  }
`;

function avatar(id, className, mode, wrapped = false, extra = '') {
  if (mode === 'missing') {
    return `<div id="${id}" class="${className}" aria-hidden="true">${className === 'comment-avatar' ? '<span aria-hidden="true">비</span>' : '비'}</div>`;
  }
  const image = `<img ${wrapped ? '' : `id="${id}" class="${className}"`} src="${mode === 'valid' ? validPhoto : '/broken.png'}" ${extra}>`;
  return wrapped
    ? `<div id="${id}" class="${className}" aria-hidden="true">${image}</div>`
    : image;
}

function conversation(index, mode = 'missing') {
  return `<button class="conversation" data-selected="false" data-room="${index}">
    ${avatar(`chatAvatar${index}`, 'chat-avatar', mode, true, 'alt=""')}
    <div><strong>상대방${index}</strong><p>교환 물건 ${index}</p><p>새 메시지</p></div>
  </button>`;
}

function fixture(kind, mode = 'broken') {
  const header = `<header class="app-header"><a class="account" aria-label="마이페이지" href="/mypage">${avatar('headerAvatar', 'header-avatar', mode === 'missing' ? 'broken' : mode, false, 'alt="" data-private-media')}</a></header>`;
  const room = `<section class="room"><header><button type="button" aria-label="채팅방 목록으로 돌아가기">←</button><h2>상대방</h2></header><div class="product">교환 상품</div>
    <div class="messages">${Array.from({ length: 40 }, (_, i) => `<div class="message" id="message${i}">메시지 ${i}</div>`).join('')}</div>
    <div class="composer-area"><form class="composer" aria-label="메시지 입력 영역"><label>＋</label><input aria-label="메시지"><button type="submit">보내기</button></form></div></section>`;
  const list = `<aside class="conversation-panel"><header><h1>전체 대화</h1><span>10</span></header><div class="notice">채팅 알림이 꺼져있어요</div><div class="list">${Array.from({ length: 10 }, (_, i) => conversation(i)).join('')}</div></aside>`;
  const content = kind === 'chat'
    ? `${header}<main id="chatMain" class="chat-main">${list}${room}</main>`
    : `${header}<main class="mypage"><section class="profile-card"><div class="identity">${avatar('profileAvatar', 'profile-avatar', mode, false, 'alt="프로필"')}<div><h2 id="nickname">비비빙</h2><p>이병관</p></div></div><button>프로필 수정</button></section>
      <dialog open class="profile-dialog" aria-labelledby="profile-edit-title"><h2 id="profile-edit-title">프로필 수정</h2><form><label>프로필 사진</label><div class="photo-editor">${avatar('editAvatar', 'edit-avatar', mode, false, 'alt="현재 프로필 사진" data-private-media')}<div class="photo-actions"><label>사진 변경<input type="file" accept="image/*" aria-label="프로필 사진 선택"></label><span>JPG, PNG, WebP</span></div></div><label>닉네임<input value="비비빙"></label></form></dialog>
      <aside class="conversation-panel"><header><h1>전체 대화</h1></header><div class="list">${conversation(0, mode)}</div></aside>
      <section><h2 id="trade-comments-title">댓글</h2><div class="comment-row">${avatar('commentAvatar', 'comment-avatar', mode, true, 'alt="" data-private-media')}<div><strong>비비빙</strong><button aria-label="비비빙 댓글 작업">⋯</button></div></div></section></main>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style></head><body>${content}</body></html>`;
}

async function connectPage(browser) {
  const address = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Chromium startup timeout: ${output}`)), 10000);
    browser.stderr.on('data', chunk => {
      output += chunk;
      const match = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(output);
      if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
    });
    browser.once('error', error => { clearTimeout(timer); reject(error); });
    browser.once('exit', code => { clearTimeout(timer); reject(new Error(`Chromium exited ${code}: ${output}`)); });
  });
  const targets = await (await fetch(`${address}/json`)).json();
  const target = targets.find(item => item.type === 'page');
  assert.ok(target, 'Chromium must expose an initial page');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
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
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 10000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  return { send, evaluate, close: () => socket.close() };
}

test('Android runtime preserves real web avatar dimensions and chat scrolling in Chromium', { timeout: 120000 }, async t => {
  assert.ok(chromePath && existsSync(chromePath), 'Set ANDROID_TEST_CHROME to an installed Chromium executable');
  const temporaryProfile = await mkdtemp(join(tmpdir(), 'gachi-web-shell-browser-'));
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/broken.png') { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(fixture(url.pathname === '/chat' ? 'chat' : 'profile', url.searchParams.get('mode') || 'broken'));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = spawn(chromePath, ['--headless', '--no-sandbox', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${temporaryProfile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let page;
  try {
    page = await connectPage(browser);
    const settle = () => page.evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 30))))');
    const size = (width, height = 820) => page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    const navigate = async (path, width) => {
      await size(width);
      await page.send('Page.navigate', { url: `${origin}${path}` });
      for (let i = 0; i < 100; i++) {
        if (await page.evaluate(`location.href === ${JSON.stringify(origin + path)} && document.readyState === 'complete'`)) break;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      await settle();
    };
    const inject = async () => { await page.evaluate(runtimeScript); await settle(); };
    const screenshot = async name => {
      const directory = process.env.ANDROID_TEST_SCREENSHOT_DIR;
      if (!directory) return;
      await mkdir(directory, { recursive: true });
      const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(join(directory, `${name}.png`), Buffer.from(data, 'base64'));
    };
    const geometry = () => page.evaluate(`Object.fromEntries(['headerAvatar','profileAvatar','editAvatar','chatAvatar0','commentAvatar'].map(id => { const node = document.getElementById(id); const r = node.getBoundingClientRect(); return [id, {width:r.width,height:r.height}]; }))`);

    for (const width of widths) {
      for (const mode of ['broken', 'missing', 'valid']) {
        await t.test(`${width}px ${mode} profiles keep web geometry and one silhouette`, async () => {
          await navigate(`/mypage?mode=${mode}`, width);
          const baseline = await geometry();
          await inject();
          assert.deepEqual(await geometry(), baseline, 'Android must not override web-owned avatar width/height');
          assert.equal(baseline.profileAvatar.width, 72);
          assert.equal(baseline.editAvatar.width, 80);
          const images = await page.evaluate(`Array.from(document.querySelectorAll('img')).map(img => ({src:img.src, ready:img.complete && img.naturalWidth > 0, fallback:img.hasAttribute('data-gachigacha-android-avatar-fallback-image')}))`);
          assert.ok(images.every(image => image.ready), 'No broken avatar icons remain');
          if (mode === 'valid') {
            assert.ok(images.every(image => image.src === validPhoto && !image.fallback), 'Existing real photos are untouched');
          } else {
            assert.ok(images.every(image => image.fallback));
            assert.equal(new Set(images.map(image => image.src)).size, 1, 'Unknown and known user names share a single default image');
            assert.doesNotMatch(decodeURIComponent(images[0].src), /<text[\s>]/, 'Default avatar must not be a nickname initial');
            if (mode === 'missing') {
              const fallbackContainers = await page.evaluate(`['profileAvatar','editAvatar','chatAvatar0','commentAvatar'].map(id => { const element=document.getElementById(id); const css=getComputedStyle(element); return {marked:element.hasAttribute('data-gachigacha-android-avatar-fallback'), background:css.backgroundImage, text:element.textContent}; })`);
              assert.ok(fallbackContainers.every(item => item.marked && item.background.includes('data:image/svg+xml')), `Text-only avatars use the same silhouette without replacing React DOM: ${JSON.stringify(fallbackContainers)}`);
              assert.ok(fallbackContainers.every(item => item.text === '비'));
            }
          }
          assert.ok(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Profiles do not widen the mobile viewport');
          if (width === 393) await screenshot(`profile-${mode}-393`);
          const sourceBefore = images[0].src;
          await page.evaluate("document.getElementById('nickname').textContent='다른이름'; window.dispatchEvent(new Event('resize'))");
          await settle();
          assert.equal(await page.evaluate("document.getElementById('headerAvatar').src"), sourceBefore, 'Header does not change from G to a nickname initial after discovering identity');
        });
      }

      await t.test(`${width}px all ten rooms remain reachable after open, close, and route reuse`, async () => {
        await navigate('/chat', width);
        const baseline = await page.evaluate('document.getElementById("chatMain").getBoundingClientRect().height');
        await inject();
        assert.equal(await page.evaluate('document.getElementById("chatMain").getBoundingClientRect().height'), baseline, 'List-only main must retain natural web content height');
        const assertLastRoomReachable = async () => {
          await page.evaluate('document.querySelector("[data-room=\'9\']").scrollIntoView({block:"end"})');
          await settle();
          assert.ok(await page.evaluate('(() => { const last=document.querySelector("[data-room=\'9\']"); const r=last.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1 && last.closest("main").getBoundingClientRect().bottom >= r.bottom; })()'), 'Room 10 is inside both viewport and its unclipped parent');
        };
        await assertLastRoomReachable();
        await page.evaluate('document.getElementById("chatMain").classList.add("open"); document.querySelector(".app-header").hidden=true; scrollTo(0,0); window.dispatchEvent(new Event("resize"))');
        await settle();
        assert.ok(await page.evaluate('!!document.querySelector("[data-gachigacha-android-chat-room]")'));
        await page.evaluate("document.querySelector('.composer input').focus()");
        await settle();
        await size(width, 460);
        await settle();
        assert.ok(await page.evaluate(`(() => { const p=document.querySelector('.messages').getBoundingClientRect(); const c=document.querySelector('.composer').getBoundingClientRect(); return p.top>=0 && p.bottom<=innerHeight+1 && c.top>=0 && c.bottom<=innerHeight+1; })()`), 'Message scroll pane and composer stay inside the keyboard-resized viewport');
        for (const edge of ['first', 'last']) {
          assert.ok(await page.evaluate(`(() => { const pane=document.querySelector('.messages'); pane.scrollTop=${edge === 'first' ? '0' : 'pane.scrollHeight'}; const child=pane.${edge === 'first' ? 'firstElementChild' : 'lastElementChild'}; const r=child.getBoundingClientRect(), p=pane.getBoundingClientRect(); return p.height>0 && r.top>=p.top-1 && r.bottom<=p.bottom+1; })()`), `Keyboard-resized messages can reach the ${edge} message`);
        }
        await page.evaluate('document.activeElement.blur()');
        await size(width);
        await page.evaluate('document.getElementById("chatMain").classList.remove("open"); document.querySelector(".app-header").hidden=false; window.dispatchEvent(new Event("resize"))');
        await settle();
        assert.equal(await page.evaluate('document.querySelectorAll("[data-gachigacha-android-chat-main], [data-gachigacha-android-chat-room], [data-gachigacha-android-chat-messages]").length'), 0, 'Closing a room clears stale clipping markers');
        await assertLastRoomReachable();
        // React can reuse the same main node when moving to another route.
        await page.evaluate('document.getElementById("chatMain").classList.add("open"); window.dispatchEvent(new Event("resize"))');
        await settle();
        await page.evaluate(`history.pushState({},'', '/mypage'); document.getElementById('chatMain').className='mypage'; document.getElementById('chatMain').innerHTML=${JSON.stringify('<h1>마이페이지</h1><div style="height:1600px">계정 관리</div>')}`);
        await settle();
        assert.equal(await page.evaluate('document.querySelectorAll("[data-gachigacha-android-chat-main]").length'), 0);
        assert.equal(await page.evaluate('document.getElementById("chatMain").style.getPropertyValue("--gachigacha-android-chat-height")'), '');
      });
    }

    await t.test('no-photo header AccountIcon keeps its SVG geometry and displays the shared silhouette', async () => {
      await navigate('/mypage?mode=missing', 393);
      const icon = '<svg id="headerAvatar" style="width:20px;height:20px;flex:0 0 auto" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      await page.evaluate(`document.querySelector('.account').innerHTML=${JSON.stringify(icon)}`);
      const before = await geometry();
      await inject();
      assert.deepEqual(await geometry(), before);
      const actual = await page.evaluate(`(() => { const e=document.getElementById('headerAvatar'); return {tag:e.tagName, width:e.getBoundingClientRect().width, marked:e.hasAttribute('data-gachigacha-android-avatar-fallback'), background:getComputedStyle(e).backgroundImage, children:Array.from(e.children).map(child=>getComputedStyle(child).visibility)}; })()`);
      assert.equal(actual.tag, 'svg', 'The React-owned AccountIcon is not replaced');
      assert.equal(actual.width, 20);
      assert.ok(actual.marked && actual.background.includes('data:image/svg+xml'));
      assert.ok(actual.children.every(value => value === 'hidden'), 'Only the original artwork is hidden, not the SVG background');
      assert.doesNotMatch(decodeURIComponent(actual.background), /<text[\s>]/);
      await screenshot('profile-missing-svg-header-393');
    });

    await t.test('profile source changes recover, fail again, and never affect unrelated images', async () => {
      await navigate('/mypage?mode=broken', 393);
      await page.evaluate(`document.body.insertAdjacentHTML('beforeend', ${JSON.stringify('<img id="productPhoto" width="90" height="90" src="/broken.png">')})`);
      await inject();
      await page.evaluate(`document.getElementById('profileAvatar').src=${JSON.stringify(validPhoto)}`);
      await settle();
      assert.equal(await page.evaluate("document.getElementById('profileAvatar').hasAttribute('data-gachigacha-android-avatar-fallback-image')"), false);
      assert.equal(await page.evaluate("document.getElementById('profileAvatar').src"), validPhoto);
      await page.evaluate("document.getElementById('profileAvatar').src='/broken.png?again'");
      await settle();
      assert.ok(await page.evaluate("document.getElementById('profileAvatar').hasAttribute('data-gachigacha-android-avatar-fallback-image')"));
      assert.equal(await page.evaluate("document.getElementById('profileAvatar').getBoundingClientRect().width"), 72);
      assert.equal(await page.evaluate("document.getElementById('productPhoto').getAttribute('src')"), '/broken.png', 'Non-avatar product media is outside this fallback policy');
    });
  } finally {
    page?.close();
    if (browser.exitCode === null) {
      await new Promise(resolve => { browser.once('exit', resolve); browser.kill('SIGTERM'); });
    }
    await new Promise(resolve => server.close(resolve));
    await rm(temporaryProfile, { recursive: true, force: true });
  }
});
