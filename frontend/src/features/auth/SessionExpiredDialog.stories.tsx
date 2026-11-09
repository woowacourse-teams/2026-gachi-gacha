import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';

import { authenticatedFetch } from './api/authenticatedFetch';
import { storeAuthTokens } from './authTokenStorage';
import { SessionExpiredDialog } from './SessionExpiredDialog';

const expiredSessionHandlers = [
  http.get('/api/v1/session-check', () =>
    HttpResponse.json({ code: 'A001', message: '만료' }, { status: 401 }),
  ),
  http.post('/api/v1/auth/refresh', () =>
    HttpResponse.json({ code: 'A002', message: '만료' }, { status: 401 }),
  ),
];

/** 저장된 토큰으로 요청했다가 갱신까지 실패하는 실제 흐름으로 만료를 만든다. */
function ExpireSessionOnMount() {
  useEffect(() => {
    storeAuthTokens({
      accessToken: 'story-expired-access-token',
      refreshToken: 'story-expired-refresh-token',
    });
    void authenticatedFetch('/api/v1/session-check').catch(() => undefined);
  }, []);

  return null;
}

const meta = {
  title: 'Features/Auth/SessionExpiredDialog',
  component: SessionExpiredDialog,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <MockWorkerBoundary handlers={expiredSessionHandlers}>
      <MemoryRouter initialEntries={['/trade/12']}>
        <SessionExpiredDialog />
        <ExpireSessionOnMount />
      </MemoryRouter>
    </MockWorkerBoundary>
  ),
} satisfies Meta<typeof SessionExpiredDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
