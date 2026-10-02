const { Blob, File } = require('node:buffer');
const {
  ReadableStream,
  TransformStream,
  WritableStream,
} = require('node:stream/web');
const { TextDecoder, TextEncoder } = require('node:util');
const { BroadcastChannel, MessagePort } = require('node:worker_threads');

Object.defineProperties(globalThis, {
  Blob: { value: Blob },
  BroadcastChannel: { value: BroadcastChannel },
  File: { value: File },
  MessagePort: { value: MessagePort },
  ReadableStream: { value: ReadableStream },
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  TransformStream: { value: TransformStream },
  WritableStream: { value: WritableStream },
});

const {
  fetch,
  FormData,
  Headers,
  Request,
  Response,
  WebSocket,
} = require('undici');

Object.defineProperties(globalThis, {
  fetch: { configurable: true, value: fetch, writable: true },
  FormData: { configurable: true, value: FormData, writable: true },
  Headers: { configurable: true, value: Headers, writable: true },
  Request: { configurable: true, value: Request, writable: true },
  Response: { configurable: true, value: Response, writable: true },
  WebSocket: { configurable: true, value: WebSocket, writable: true },
});
