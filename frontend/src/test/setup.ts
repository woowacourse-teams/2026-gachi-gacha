import '@testing-library/jest-dom';

import { afterAll, afterEach, beforeAll } from '@jest/globals';
import { cleanup } from '@testing-library/react';

import { clearAuthTokens } from '@/features/auth/authTokenStorage';

import { server } from './server';

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
