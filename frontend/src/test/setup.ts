import '@testing-library/jest-dom/jest-globals';

import { afterAll, afterEach, beforeAll } from '@jest/globals';
import { cleanup } from '@testing-library/react';

import { clearAuthTokens } from '@/features/auth/authTokenStorage';

import { server } from './server';

Object.defineProperties(URL, {
  createObjectURL: {
    configurable: true,
    value: () => 'blob:test-preview',
  },
  revokeObjectURL: {
    configurable: true,
    value: () => undefined,
  },
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  clearAuthTokens();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterAll(() => {
  server.close();
});
