import assert from "node:assert/strict";

// Minimal shared CDP transport; no production code or browser framework dependency.
export async function connectPage(browser) {
  const address = await new Promise((resolve, reject) => {
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
        resolve(`http://127.0.0.1:${match[1]}`);
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
    target = (await (await fetch(`${address}/json`)).json()).find(
      (item) => item.type === "page",
    );
    if (!target) await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.ok(target, "Chromium exposes a test page");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
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
    new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 10000);
      pending.set(id, { resolve, reject, timer });
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
