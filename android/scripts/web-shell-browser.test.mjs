import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import {
  createWebShellConfirmLeaveScript,
  createWebShellOverlayBackScript,
  createWebShellRuntimeScript,
} from '../src/domains/webShell/webShellPolicy.ts';
import {
  createWebShellSessionSnapshotBridgeScript,
  createWebShellSessionSyncScript,
} from '../src/domains/webShell/webShellSessionBridge.ts';

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

// These readiness markers and photo close labels are copied from origin/main's
// updates/route.tsx, TradeDetail.tsx and the shared PhotoViewer (2026-11-03).
// Route commits are intentionally separate from pushState to model React's
// asynchronous loading without pulling React or the web application into CI.
function scrollPageContent(path, pending = false) {
  if (pending) return '<p>불러오는 중</p>';
  if (path === '/updates') {
    return '<h1>업데이트 소식</h1><ol aria-label="서비스 업데이트 목록"><li>최근 소식</li></ol>';
  }
  if (/^\/trade\/\d+$/.test(path)) {
    return `<h1>교환 물품</h1><a href="${path}/edit">수정하기</a><section><h2 id="trade-comments-title">댓글 0</h2></section>`;
  }
  if (/^\/trade\/\d+\/edit$/.test(path)) {
    return '<h1>교환글 수정</h1><form id="trade-edit-form"><label>제목<input name="title" value="원래 제목"></label><label>설명<textarea name="description">원래 설명</textarea></label><button type="submit">수정하기</button></form>';
  }
  return '<h1>거래/교환</h1><button id="photoLauncher">사진 크게 보기</button>';
}

function scrollFixture(path, pending) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}main{min-height:3600px;padding:16px}button{min-height:40px}</style></head><body><main id="routeRoot">${scrollPageContent(path, pending)}</main></body></html>`;
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

test('Android WebView preserves web layout, overlays, navigation, drafts and scroll in Chromium', { timeout: 120000 }, async t => {
  assert.ok(chromePath && existsSync(chromePath), 'Set ANDROID_TEST_CHROME to an installed Chromium executable');
  const temporaryProfile = await mkdtemp(join(tmpdir(), 'gachi-web-shell-browser-'));
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/broken.png') { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(url.searchParams.has('scroll-fixture')
      ? scrollFixture(url.pathname, url.searchParams.has('pending'))
      : fixture(url.pathname === '/chat' ? 'chat' : 'profile', url.searchParams.get('mode') || 'broken'));
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
    const captureBackMessages = () => page.evaluate('window.backResults=[];window.ReactNativeWebView={postMessage:value=>window.backResults.push(JSON.parse(value))};true');
    const pressBack = async requestId => {
      await captureBackMessages();
      await page.evaluate(createWebShellOverlayBackScript(requestId));
      await settle();
      return page.evaluate("window.backResults.filter(item=>item.type==='gachigacha:overlay-back-result')");
    };
    const expectBackHandled = async (requestId, handled = true) => {
      assert.deepEqual(await pressBack(requestId), [{ type: 'gachigacha:overlay-back-result', requestId, handled }]);
    };
    const setScroll = async (top = 1200) => {
      await page.evaluate(`scrollTo({top:${top},left:0,behavior:'instant'})`);
      await settle();
      assert.equal(await page.evaluate('scrollY'), top, 'Fixture must be able to scroll before testing navigation');
    };
    const commitRoute = async (path, method = 'pushState', pending = false) => {
      const pathname = new URL(path, origin).pathname;
      await page.evaluate(`history.${method}({},'',${JSON.stringify(path)});document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent(pathname, pending))}`);
      await settle();
    };
    const assertScroll = async (expected, message) => {
      await settle();
      assert.equal(await page.evaluate('scrollY'), expected, message);
    };
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

    await t.test('photo viewer system back uses the visible web close handler without navigating', async t => {
      const labels = ['상품 사진 크게 보기 닫기', '채팅 사진 닫기', '사진 전체 보기 닫기'];
      for (const [index, label] of labels.entries()) {
        await t.test(label, async () => {
          await navigate('/trade?scroll-fixture', 393);
          await inject();
          await setScroll();
          const initialUrl = await page.evaluate('location.href');
          const viewer = `<section id="photoViewer" role="dialog" aria-modal="true" style="position:fixed;inset:20px;background:white"><button aria-label="${label}">닫기</button><img src="${validPhoto}" alt="사진"></section>`;
          await page.evaluate(`window.backResults=[];window.closeCount=0;window.ReactNativeWebView={postMessage:value=>window.backResults.push(JSON.parse(value))};document.body.style.overflow='hidden';document.body.insertAdjacentHTML('beforeend',${JSON.stringify(viewer)});document.querySelector('#photoViewer button').onclick=()=>{window.closeCount++;document.getElementById('photoViewer').remove();document.body.style.overflow='';document.getElementById('photoLauncher').focus({preventScroll:true})}`);
          await page.evaluate(createWebShellOverlayBackScript(index + 1));
          await settle();
          assert.deepEqual(await page.evaluate('window.backResults'), [{ type: 'gachigacha:overlay-back-result', requestId: index + 1, handled: true }]);
          assert.equal(await page.evaluate('window.closeCount'), 1, 'The web close handler, not DOM removal alone, must run');
          assert.equal(await page.evaluate('document.body.style.overflow'), '');
          assert.equal(await page.evaluate('document.activeElement.id'), 'photoLauncher');
          assert.equal(await page.evaluate('location.href'), initialUrl);
          await assertScroll(1200, 'Closing a photo preserves the underlying page scroll');
          await page.evaluate('window.backResults=[]');
          await page.evaluate(createWebShellOverlayBackScript(index + 11));
          assert.deepEqual(await page.evaluate('window.backResults'), [{ type: 'gachigacha:overlay-back-result', requestId: index + 11, handled: false }]);
        });
      }
      await t.test('a visible disabled or unknown modal consumes back instead of leaving its page', async () => {
        await navigate('/trade?scroll-fixture', 393);
        const label = labels[0];
        const controls = `<section role="dialog" aria-modal="true" hidden><button aria-label="${label}">hidden</button></section><section role="dialog" aria-modal="true" style="visibility:hidden"><button aria-label="${label}">invisible</button></section><section role="dialog" aria-modal="true"><button disabled aria-label="${label}">disabled</button><button aria-label="프로필 수정 닫기">profile</button></section><button aria-label="${label}">outside dialog</button>`;
        await page.evaluate(`window.backResults=[];window.ReactNativeWebView={postMessage:value=>window.backResults.push(JSON.parse(value))};document.body.insertAdjacentHTML('beforeend',${JSON.stringify(controls)})`);
        await page.evaluate(createWebShellOverlayBackScript(99));
        assert.deepEqual(await page.evaluate('window.backResults'), [{ type: 'gachigacha:overlay-back-result', requestId: 99, handled: true }]);
      });
      await t.test('an expired queued back request cannot close a newer viewer or send a stale response', async () => {
        await navigate('/trade?scroll-fixture', 393);
        const viewer = `<section id="photoViewer" role="dialog" aria-modal="true"><button aria-label="${labels[0]}">닫기</button></section>`;
        await page.evaluate(`window.backResults=[];window.closeCount=0;window.ReactNativeWebView={postMessage:value=>window.backResults.push(JSON.parse(value))};document.body.insertAdjacentHTML('beforeend',${JSON.stringify(viewer)});document.querySelector('#photoViewer button').onclick=()=>{window.closeCount++;document.getElementById('photoViewer').remove()}`);
        await page.evaluate(createWebShellOverlayBackScript(100, Date.now() - 1000));
        await settle();
        assert.equal(await page.evaluate('window.closeCount'), 0);
        assert.ok(await page.evaluate("!!document.getElementById('photoViewer')"));
        assert.deepEqual(await page.evaluate('window.backResults'), []);
      });
    });

    await t.test('real web native dialogs and popovers close only the uppermost layer', async t => {
      const labels = ['프로필 수정 창 닫기', '회원 탈퇴 창 닫기', '선호 거래 지역 선택 창 닫기', '구매 매장 선택 창 닫기', '거래 장소 선택 창 닫기', '교환 장소 선택 창 닫기'];
      for (const [index, label] of labels.entries()) {
        await t.test(`native showModal: ${label}`, async () => {
          await navigate('/trade?scroll-fixture', 393);
          await inject();
          await setScroll(700);
          // Native <dialog> has an implicit accessibility role; the real web does
          // NOT add role="dialog" or aria-modal attributes to this DOM element.
          await page.evaluate(`document.body.insertAdjacentHTML('beforeend',${JSON.stringify(`<dialog id="nativeDialog" aria-labelledby="nativeTitle"><h2 id="nativeTitle">장소 선택</h2><button type="button" aria-label="${label}">×</button><input value="입력 중"></dialog>`)});window.closeCount=0;document.querySelector('#nativeDialog button').onclick=()=>{window.closeCount++;document.getElementById('nativeDialog').close()};document.getElementById('nativeDialog').showModal()`);
          await expectBackHandled(200 + index);
          assert.equal(await page.evaluate('window.closeCount'), 1);
          assert.equal(await page.evaluate('document.getElementById("nativeDialog").open'), false);
          assert.equal(await page.evaluate('location.pathname'), '/trade');
          await assertScroll(700, 'Closing a native dialog preserves the underlying list');
          await expectBackHandled(220 + index, false);
        });
      }
      await t.test('nested place picker closes before profile and preserves its unfinished input', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await page.evaluate(`document.body.insertAdjacentHTML('beforeend','<dialog id="profile"><h2>프로필 수정</h2><button aria-label="프로필 수정 창 닫기">×</button><input id="nicknameDraft" value="저장 전 닉네임"></dialog><dialog id="place"><h2>선호 거래 지역 선택</h2><button aria-label="선호 거래 지역 선택 창 닫기">×</button></dialog>');for(const id of ['profile','place']){const dialog=document.getElementById(id);dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal()}`);
        await expectBackHandled(240);
        assert.deepEqual(await page.evaluate("['profile','place'].map(id=>document.getElementById(id).open)"), [true, false]);
        assert.equal(await page.evaluate('document.getElementById("nicknameDraft").value'), '저장 전 닉네임');
        await expectBackHandled(241);
        assert.equal(await page.evaluate('document.getElementById("profile").open'), false);
        await expectBackHandled(242, false);
      });
      await t.test('native top layer wins over a later DOM photo overlay with a high z-index', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await page.evaluate(`document.body.insertAdjacentHTML('beforeend','<dialog id="nativeTop"><button aria-label="거래 장소 선택 창 닫기">×</button></dialog><section id="photoBehind" role="dialog" aria-modal="true" style="position:fixed;inset:0;z-index:999999"><button aria-label="상품 사진 크게 보기 닫기">×</button></section>');document.querySelector('#nativeTop button').onclick=()=>document.getElementById('nativeTop').close();document.querySelector('#photoBehind button').onclick=()=>document.getElementById('photoBehind').remove();document.getElementById('nativeTop').showModal()`);
        await expectBackHandled(250);
        assert.equal(await page.evaluate('document.getElementById("nativeTop").open'), false);
        assert.ok(await page.evaluate('!!document.getElementById("photoBehind")'));
        await expectBackHandled(251);
        assert.equal(await page.evaluate('!!document.getElementById("photoBehind")'), false);
      });
      await t.test('CSS overlay stacking closes the visibly highest layer rather than the first DOM match', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await page.evaluate(`document.body.insertAdjacentHTML('beforeend','<section id="high" role="dialog" aria-modal="true" style="position:fixed;inset:30px;z-index:500;background:white"><button aria-label="신고 창 닫기">×</button></section><section id="low" role="dialog" aria-modal="true" style="position:fixed;inset:20px;z-index:100;background:white"><button aria-label="상품 사진 크게 보기 닫기">×</button></section>');for(const id of ['high','low'])document.querySelector('#'+id+' button').onclick=()=>document.getElementById(id).remove()`);
        await expectBackHandled(260);
        assert.equal(await page.evaluate('!!document.getElementById("high")'), false);
        assert.ok(await page.evaluate('!!document.getElementById("low")'));
      });
      for (const [index, control] of [
        { container: 'role="dialog" aria-labelledby="noticeTitle" aria-live="polite"', label: '알림 닫기' },
        { container: 'aria-label="가챠 검색 결과"', label: '검색 결과 닫기' },
      ].entries()) {
        await t.test(`nonmodal popover: ${control.label}`, async () => {
          await navigate('/trade?scroll-fixture', 393);
          await inject();
          await page.evaluate(`document.body.insertAdjacentHTML('beforeend',${JSON.stringify(`<section id="popover" ${control.container} style="position:fixed;inset:60px 10px"><h2 id="noticeTitle">알림</h2><button aria-label="${control.label}">×</button></section>`)});document.querySelector('#popover button').onclick=()=>document.getElementById('popover').remove()`);
          await expectBackHandled(270 + index);
          assert.equal(await page.evaluate('!!document.getElementById("popover")'), false);
        });
      }
      await t.test('confirmation cancels safely and never clicks the destructive action', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await page.evaluate(`window.confirmCount=0;document.body.insertAdjacentHTML('beforeend','<section id="confirmation" role="alertdialog" aria-modal="true" style="position:fixed;inset:40px"><h2>삭제할까요?</h2><button type="button" id="cancelDelete">취소</button><button type="button" id="confirmDelete">삭제하기</button></section>');document.getElementById('cancelDelete').onclick=()=>document.getElementById('confirmation').remove();document.getElementById('confirmDelete').onclick=()=>window.confirmCount++`);
        await expectBackHandled(280);
        assert.equal(await page.evaluate('window.confirmCount'), 0);
        assert.equal(await page.evaluate('!!document.getElementById("confirmation")'), false);
      });
      await t.test('the actual user safety menu without aria-controls closes through its own trigger', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await page.evaluate(`window.destructiveCount=0;document.body.insertAdjacentHTML('beforeend','<section id="parentDialog" role="dialog" aria-modal="true" style="position:fixed;inset:20px"><button aria-label="채팅 닫기">×</button><div id="userMenuRoot"><button id="userMenuTrigger" aria-label="상대방 사용자 메뉴" aria-haspopup="menu" aria-expanded="true">•••</button><div role="menu"><button role="menuitem">신고하기</button><button role="menuitem">차단하기</button></div></div></section>');document.querySelector('#parentDialog > button').onclick=()=>document.getElementById('parentDialog').remove();document.getElementById('userMenuTrigger').onclick=()=>{document.querySelector('#userMenuRoot [role=menu]').remove();document.getElementById('userMenuTrigger').setAttribute('aria-expanded','false')};for(const b of document.querySelectorAll('[role=menuitem]'))b.onclick=()=>window.destructiveCount++`);
        await expectBackHandled(285);
        assert.equal(await page.evaluate('!!document.querySelector("[role=menu]")'), false);
        assert.equal(await page.evaluate('document.getElementById("userMenuTrigger").getAttribute("aria-expanded")'), 'false');
        assert.ok(await page.evaluate('!!document.getElementById("parentDialog")'), 'Closing a nested menu must not close its chat dialog');
        assert.equal(await page.evaluate('window.destructiveCount'), 0);
      });
      await t.test('pending submission and internally guarded profile close remain in place', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await page.evaluate(`document.body.insertAdjacentHTML('beforeend','<section id="pending" role="dialog" aria-modal="true" aria-labelledby="trade-submission-title" style="position:fixed;inset:20px"><h2 id="trade-submission-title">게시글 등록 중</h2></section>')`);
        await expectBackHandled(290);
        assert.ok(await page.evaluate('!!document.getElementById("pending")'));
        await page.evaluate(`document.getElementById('pending').remove();document.body.insertAdjacentHTML('beforeend','<dialog id="savingProfile"><button aria-label="프로필 수정 창 닫기">×</button><button disabled>저장 중...</button></dialog>');document.querySelector('#savingProfile button').onclick=()=>{};document.getElementById('savingProfile').showModal()`);
        await expectBackHandled(291);
        assert.equal(await page.evaluate('document.getElementById("savingProfile").open'), true, 'The web saving guard must not be bypassed by force-closing the DOM');
      });
    });

    await t.test('search category back restores one actual category selection at a time', async () => {
      await navigate('/search?scroll-fixture', 393);
      await inject();
      // The feed can arrive after the app runtime: model its lazy React commit.
      await page.evaluate(`document.getElementById('routeRoot').innerHTML='<nav aria-label="가챠 카테고리"><button aria-pressed="true">산리오</button><button aria-pressed="false">치이카와</button><button aria-pressed="false">포켓몬</button></nav><h2 id="categoryHeading">산리오</h2>';for(const b of document.querySelectorAll('nav button'))b.onclick=()=>{for(const sibling of b.parentElement.children)sibling.setAttribute('aria-pressed',String(sibling===b));document.getElementById('categoryHeading').textContent=b.textContent}`);
      await settle();
      await page.evaluate("document.querySelectorAll('nav button')[1].click()");
      await settle();
      await page.evaluate("document.querySelectorAll('nav button')[2].click()");
      await settle();
      await expectBackHandled(300);
      assert.equal(await page.evaluate('document.getElementById("categoryHeading").textContent'), '치이카와');
      await expectBackHandled(301);
      assert.equal(await page.evaluate('document.getElementById("categoryHeading").textContent'), '산리오');
      await expectBackHandled(302, false);
      assert.equal(await page.evaluate('location.pathname'), '/search', 'Category changes do not manufacture route navigation');
      await page.evaluate("document.querySelectorAll('nav button')[1].click()");
      await settle();
      await page.evaluate("history.pushState({},'', '/trade');document.getElementById('routeRoot').innerHTML='';history.pushState({},'', '/search');document.getElementById('routeRoot').innerHTML='<nav aria-label=\"가챠 카테고리\"><button aria-pressed=\"true\">산리오</button><button aria-pressed=\"false\">치이카와</button></nav>'");
      await settle();
      await expectBackHandled(303, false);
    });

    await t.test('dirty trade form asks once and cancel preserves fields while explicit approval navigates', async () => {
      await navigate('/trade?scroll-fixture', 393);
      await inject();
      await commitRoute('/trade/42');
      await commitRoute('/trade/42/edit');
      await page.evaluate("const input=document.querySelector('#trade-edit-form input');input.value='수정 중인 제목';input.dispatchEvent(new Event('input',{bubbles:true}))");
      await expectBackHandled(310);
      const confirm = await page.evaluate("window.backResults.find(item=>item.type==='gachigacha:confirm-leave-trade')");
      assert.ok(confirm, 'Dirty-form Back must ask the native confirmation, not navigate immediately');
      assert.equal(confirm.requestId, 310);
      assert.equal(confirm.path, '/trade/42/edit');
      await page.evaluate(createWebShellConfirmLeaveScript(310, false));
      await settle();
      assert.equal(await page.evaluate('location.pathname'), '/trade/42/edit');
      assert.equal(await page.evaluate('document.querySelector("#trade-edit-form input").value'), '수정 중인 제목');
      await expectBackHandled(311);
      await page.evaluate(createWebShellConfirmLeaveScript(310, true));
      await settle();
      assert.equal(await page.evaluate('location.pathname'), '/trade/42/edit', 'An obsolete confirmation request cannot approve the newer prompt');
      await page.evaluate(createWebShellConfirmLeaveScript(311, true));
      for (let i = 0; i < 100 && await page.evaluate("location.pathname === '/trade/42/edit'"); i++) await new Promise(resolve => setTimeout(resolve, 20));
      assert.equal(await page.evaluate('location.pathname'), '/trade/42');
    });

    await t.test('trade creation guards hidden place values, photo-only drafts, and safe link navigation', async t => {
      const prepareCreateForm = async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await page.evaluate(`history.pushState({idx:1},'', '/trade/new');document.getElementById('routeRoot').innerHTML='<h1>교환글 작성</h1><form id="trade-create-form"><input name="title" value=""><textarea name="description"></textarea><input type="hidden" name="tradePlace.address" value=""><input type="checkbox" name="categoryIds" value="1"><input type="file" accept="image/*"><div id="draftPhotos"></div><button type="submit">등록하기</button></form><a id="leaveDraft" href="/search">검색</a>';document.getElementById('leaveDraft').onclick=event=>{event.preventDefault();history.pushState({idx:2},'', '/search');document.getElementById('routeRoot').innerHTML='<h1>검색</h1>'}`);
        await settle();
      };
      await t.test('pristine fields pass through, selected places ask, and restoring values clears dirty state', async () => {
        await prepareCreateForm();
        await expectBackHandled(320, false);
        await page.evaluate(`document.querySelector('input[name="tradePlace.address"]').value='서울 마포구 양화로 160'`);
        await expectBackHandled(321);
        assert.equal(await page.evaluate("window.backResults.find(item=>item.type==='gachigacha:confirm-leave-trade').path"), '/trade/new');
        await page.evaluate(createWebShellConfirmLeaveScript(321, false));
        await page.evaluate(`document.querySelector('input[name="tradePlace.address"]').value=''`);
        await expectBackHandled(322, false);
      });
      await t.test('a selected photo remains guarded after React clears its file input', async () => {
        await prepareCreateForm();
        await page.evaluate(`const photo=document.querySelector('input[type=file]');const transfer=new DataTransfer();transfer.items.add(new File(['draft'], 'draft.png', {type:'image/png'}));photo.files=transfer.files;photo.dispatchEvent(new Event('change',{bubbles:true}));photo.value='';document.getElementById('draftPhotos').innerHTML='<div data-trade-photo-index="0"><img alt="사진 미리보기" src="${validPhoto}"></div>'`);
        await settle();
        await expectBackHandled(323);
        assert.equal(await page.evaluate('document.querySelector("input[type=file]").files.length'), 0);
        await page.evaluate(createWebShellConfirmLeaveScript(323, false));
        assert.equal(await page.evaluate('document.querySelectorAll("[data-trade-photo-index] img").length'), 1, 'Cancel must preserve the photo draft');
      });
      await t.test('same-origin links wait for approval and route-away invalidates an old approval', async () => {
        await prepareCreateForm();
        await page.evaluate(`document.querySelector('input[name=title]').value='작성 중';window.linkClicked=false;document.getElementById('leaveDraft').addEventListener('click',()=>window.linkClicked=true)`);
        await captureBackMessages();
        await page.evaluate('document.getElementById("leaveDraft").click()');
        await settle();
        const requestId = await page.evaluate("window.backResults.find(item=>item.type==='gachigacha:confirm-leave-trade').requestId");
        assert.equal(await page.evaluate('location.pathname'), '/trade/new');
        assert.equal(await page.evaluate('window.linkClicked'), false);
        await page.evaluate(createWebShellConfirmLeaveScript(requestId, false));
        await captureBackMessages();
        await page.evaluate('document.getElementById("leaveDraft").click()');
        await settle();
        const approvedId = await page.evaluate("window.backResults.find(item=>item.type==='gachigacha:confirm-leave-trade').requestId");
        await page.evaluate(createWebShellConfirmLeaveScript(approvedId, true));
        await settle();
        assert.equal(await page.evaluate('location.pathname'), '/search');
        assert.equal(await page.evaluate('window.linkClicked'), true, 'Approval invokes the original web link handler');
        await prepareCreateForm();
        await page.evaluate(`document.querySelector('input[name=title]').value='작성 중'`);
        await expectBackHandled(324);
        await page.evaluate(`history.pushState({},'', '/mypage');document.getElementById('routeRoot').innerHTML='<h1>마이페이지</h1>'`);
        await settle();
        await page.evaluate(createWebShellConfirmLeaveScript(324, true));
        await settle();
        assert.equal(await page.evaluate('location.pathname'), '/mypage', 'A confirmation cannot navigate after its form is gone');
      });
    });

    await t.test('same-member token refresh after gallery return preserves the native profile dialog and File draft', async () => {
      await navigate('/mypage?mode=valid', 393);
      const token = serial => `test.${Buffer.from(JSON.stringify({ type: 'access', memberId: 42, serial })).toString('base64url')}.signature`;
      await page.evaluate(`sessionStorage.setItem('gachi-gacha:access-token',${JSON.stringify(token(1))});sessionStorage.setItem('gachi-gacha:refresh-token','old-refresh');window.galleryDraftSentinel='still-here';const dialog=document.querySelector('dialog');dialog.removeAttribute('open');dialog.showModal();const input=dialog.querySelector('input[type=file]');const transfer=new DataTransfer();transfer.items.add(new File(['profile draft'], 'chosen-profile.png', {type:'image/png'}));input.files=transfer.files;dialog.querySelector('input:not([type=file])').value='저장하지 않은 닉네임'`);
      await page.evaluate(createWebShellSessionSnapshotBridgeScript());
      await captureBackMessages();
      await page.evaluate(createWebShellSessionSyncScript({ accessToken: token(2), refreshToken: 'new-refresh' }));
      await settle();
      assert.equal(await page.evaluate('window.galleryDraftSentinel'), 'still-here', 'A same-member refresh must not reload the document');
      assert.equal(await page.evaluate('document.querySelector("dialog").open'), true);
      assert.equal(await page.evaluate('document.querySelector("dialog input[type=file]").files[0].name'), 'chosen-profile.png');
      assert.equal(await page.evaluate('document.querySelector("dialog input:not([type=file])").value'), '저장하지 않은 닉네임');
      assert.equal(await page.evaluate('sessionStorage.getItem("gachi-gacha:access-token")'), token(2));
      assert.equal(await page.evaluate('sessionStorage.getItem("gachi-gacha:refresh-token")'), 'new-refresh');
      assert.deepEqual(await page.evaluate('window.backResults'), [{ type: 'gachigacha:auth-session-synced' }], 'Native writes do not echo a snapshot back and create an update loop');
      await page.evaluate(`sessionStorage.setItem('gachi-gacha:access-token',${JSON.stringify(token(3))});sessionStorage.setItem('gachi-gacha:refresh-token','web-refresh')`);
      await settle();
      const snapshots = await page.evaluate("window.backResults.filter(item=>item.type==='gachigacha:auth-session-snapshot')");
      assert.equal(snapshots.length, 1, 'The web refresh posts one complete pair, not intermediate stale credentials');
      assert.deepEqual(snapshots[0].tokens, { accessToken: token(3), refreshToken: 'web-refresh' });
      assert.equal(await page.evaluate('document.querySelector("dialog").open'), true);
    });

    await t.test('trade detail and edit entries reset only after their matching content commits', async t => {
      for (const method of ['pushState', 'replaceState']) {
        await t.test(`${method}: delayed detail render, later mutations and different IDs`, async () => {
          await navigate('/trade/42/edit?scroll-fixture', 393);
          await inject();
          await setScroll();
          await commitRoute('/trade/42', method, true);
          await assertScroll(1200, 'Wait for the detail DOM instead of scrolling the loading screen');
          await page.evaluate(`document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/trade/42'))}`);
          await assertScroll(0, 'The saved detail opens at its top once ready');
          await setScroll(900);
          await page.evaluate("document.getElementById('routeRoot').insertAdjacentHTML('beforeend','<p>댓글 갱신</p>')");
          await assertScroll(900, 'Later rendering on the same detail does not undo user scrolling');
          await commitRoute('/trade/42/edit', method);
          await setScroll(1100);
          await commitRoute('/trade/99', method);
          await assertScroll(0, 'A new detail also opens at its own top');
          await setScroll(1100);
          await commitRoute('/trade', method);
          await assertScroll(1100, 'The trade list retains its existing scroll');
          await commitRoute('/trade/42/edit', method);
          await setScroll(1100);
          await commitRoute('/trade/42#trade-comments-title', method);
          await assertScroll(1100, 'A detail comment anchor is never overridden by edit-return handling');
        });
      }
      await t.test('popstate reset runs after browser history restoration', async () => {
        await navigate('/trade/42?scroll-fixture', 393);
        await inject();
        await setScroll(800);
        await commitRoute('/trade/42/edit');
        await setScroll(1300);
        await page.evaluate(`window.addEventListener('popstate',()=>{document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/trade/42'))};requestAnimationFrame(()=>scrollTo(0,800))},{once:true});history.back()`);
        for (let i = 0; i < 100; i++) {
          if (await page.evaluate("location.pathname === '/trade/42'")) break;
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        await assertScroll(0, 'A later history restoration cannot overwrite the saved-detail top reset');
      });
      await t.test('list to detail and detail to edit wait for route-specific readiness markers', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await setScroll(1400);
        await commitRoute('/trade/42', 'pushState', true);
        await assertScroll(1400, 'The list is not scrolled while a detail is still loading');
        await page.evaluate(`document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/trade/42'))}`);
        await assertScroll(0, 'Detail readiness is its actual trade-comments-title marker');
        await setScroll(900);
        await commitRoute('/trade/42/edit', 'pushState', true);
        await assertScroll(900, 'An edit loading placeholder must not scroll the old detail');
        await page.evaluate(`document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/trade/42/edit'))}`);
        await assertScroll(0, 'Edit readiness is its actual trade-edit-form marker');
      });
      await t.test('returning to the list preserves browser-restored list position', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await setScroll(1250);
        await commitRoute('/trade/42');
        await assertScroll(0, 'Detail navigation starts at top');
        await page.evaluate(`window.addEventListener('popstate',()=>{document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/trade'))};requestAnimationFrame(()=>scrollTo(0,1250))},{once:true});history.back()`);
        for (let i = 0; i < 100; i++) {
          if (await page.evaluate("location.pathname === '/trade'")) break;
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        await assertScroll(1250, 'Android does not override native/browser list restoration');
      });
      await t.test('late detail content and final-frame hash changes cannot hijack another destination', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await setScroll(1100);
        await commitRoute('/trade/42', 'pushState', true);
        await commitRoute('/search');
        await page.evaluate(`document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/trade/42'))}`);
        await assertScroll(1100, 'A late detail response cannot scroll the search route');
        await commitRoute('/trade');
        await page.evaluate(`history.pushState({},'','/trade/42');document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/trade/42'))};requestAnimationFrame(()=>history.replaceState({},'','/trade/42#trade-comments-title'))`);
        await assertScroll(1100, 'A hash selected before the reset frame cancels the queued detail reset');
      });
    });

    await t.test('updates start at the top without hijacking hashes, other routes or later scrolling', async t => {
      await t.test('initial document and SPA entry wait for actual updates content', async () => {
        await navigate('/updates?scroll-fixture', 393);
        await setScroll();
        await inject();
        await assertScroll(0, 'An initially restored updates document also starts at top');
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await setScroll();
        await commitRoute('/updates', 'pushState', true);
        await assertScroll(1200, 'Pending updates do not scroll the previous screen early');
        await page.evaluate(`document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/updates'))}`);
        await assertScroll(0, 'Updates reset after delayed content arrives');
        await setScroll(900);
        await commitRoute('/updates?filter=all', 'replaceState');
        await assertScroll(900, 'Same-path query changes are not a fresh entry');
        await page.evaluate("document.getElementById('routeRoot').insertAdjacentHTML('beforeend','<p>이미지 로드</p>')");
        await assertScroll(900, 'Late content and photo closing do not repeatedly force top');
      });
      await t.test('route-away and deliberate user scroll cancel a pending reset', async () => {
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await setScroll();
        await commitRoute('/updates', 'pushState', true);
        await commitRoute('/search');
        await page.evaluate(`document.getElementById('routeRoot').insertAdjacentHTML('beforeend',${JSON.stringify(scrollPageContent('/updates'))})`);
        await assertScroll(1200, 'A stale updates response cannot scroll another route');
        await navigate('/trade?scroll-fixture', 393);
        await inject();
        await setScroll();
        await commitRoute('/updates', 'pushState', true);
        await page.evaluate("window.dispatchEvent(new WheelEvent('wheel',{deltaY:100}))");
        await page.evaluate(`document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/updates'))}`);
        await assertScroll(1200, 'Explicit user scrolling cancels a delayed top reset');
      });
      await t.test('initial and SPA hash destinations preserve scroll, including a queued reset', async () => {
        await navigate('/updates?scroll-fixture#release-note', 393);
        await setScroll();
        await inject();
        await assertScroll(1200, 'Initial deep links keep their anchor position');
        await commitRoute('/trade');
        await commitRoute('/updates#release-note');
        await assertScroll(1200, 'SPA deep links keep their anchor position');
        await commitRoute('/trade');
        await page.evaluate(`history.pushState({},'','/updates');document.getElementById('routeRoot').innerHTML=${JSON.stringify(scrollPageContent('/updates'))};requestAnimationFrame(()=>history.replaceState({},'','/updates#release-note'))`);
        await assertScroll(1200, 'Adding a same-route hash before a queued reset fires must cancel that reset');
      });
    });

    // Opt in to the actual deployed web contract, without credentials or writes:
    // ANDROID_TEST_LIVE_ORIGIN=https://dev.gachigacha.kro.kr
    // ANDROID_TEST_SCREENSHOT_DIR=/tmp/gachi-android-live-back
    if (process.env.ANDROID_TEST_LIVE_ORIGIN) {
      await t.test('deployed public web photo and category back smoke', async () => {
        const liveOrigin = new URL(process.env.ANDROID_TEST_LIVE_ORIGIN).origin;
        assert.equal(new URL(liveOrigin).protocol, 'https:', 'Live verification uses HTTPS');
        const waitFor = async (expression, description) => {
          for (let i = 0; i < 150; i++) {
            if (await page.evaluate(expression)) return;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          throw new Error(`Actual web did not render ${description}`);
        };
        await size(393);
        await page.send('Page.navigate', { url: `${liveOrigin}/trade` });
        await waitFor("[...document.querySelectorAll('a[href]')].some(a=>/^\\/trade\\/\\d+$/.test(a.getAttribute('href')))", 'a public trade detail link');
        const detailPath = await page.evaluate("[...document.querySelectorAll('a[href]')].find(a=>/^\\/trade\\/\\d+$/.test(a.getAttribute('href'))).getAttribute('href')");
        await page.send('Page.navigate', { url: `${liveOrigin}${detailPath}` });
        await waitFor("[...document.querySelectorAll('button[aria-label]')].some(b=>/상품 사진 크게 보기$/.test(b.getAttribute('aria-label')))", 'a real product photo launcher');
        await inject();
        await page.evaluate("[...document.querySelectorAll('button[aria-label]')].find(b=>/상품 사진 크게 보기$/.test(b.getAttribute('aria-label'))).click()");
        await waitFor("!!document.querySelector('[role=dialog][aria-modal=true] button[aria-label=\"상품 사진 크게 보기 닫기\"]')", 'the deployed PhotoViewer');
        await screenshot('live-dev-photo-before-back');
        await expectBackHandled(500);
        assert.equal(await page.evaluate('!!document.querySelector("[role=dialog][aria-modal=true]")'), false);
        assert.equal(await page.evaluate('location.pathname'), detailPath);
        await screenshot('live-dev-photo-after-back');
        await page.send('Page.navigate', { url: `${liveOrigin}/search` });
        await waitFor("!!document.querySelector('nav[aria-label=\"가챠 카테고리\"] button[aria-pressed=true]')", 'the deployed category navigation');
        await inject();
        await page.evaluate("[...document.querySelectorAll('nav[aria-label=\"가챠 카테고리\"] button')].find(b=>b.textContent==='치이카와').click()");
        await waitFor("document.querySelector('nav[aria-label=\"가챠 카테고리\"] button[aria-pressed=true]').textContent==='치이카와'", 'the selected category');
        await expectBackHandled(501);
        assert.equal(await page.evaluate('document.querySelector(\'nav[aria-label="가챠 카테고리"] button[aria-pressed=true]\').textContent'), '산리오');
        assert.equal(await page.evaluate('location.pathname'), '/search');
        await screenshot('live-dev-category-after-back');
      });
    }
  } finally {
    page?.close();
    if (browser.exitCode === null) {
      await new Promise(resolve => { browser.once('exit', resolve); browser.kill('SIGTERM'); });
    }
    await new Promise(resolve => server.close(resolve));
    await rm(temporaryProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
