import { type ReactNode, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useParams } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import {
  clearAuthTokens,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import { MockWorkerBoundary } from '@/mocks/MockWorkerBoundary';
import { tradeHandlers } from '@/routes/trade/mocks/tradeHandlers';

import { TradeEditRoute } from './route';
import { TradeDetailRoute } from '../tradeDetail/route';

// 게시글 1번 작성자(memberId 3)로 로그인한 것처럼 보이도록 payload만 채운 토큰
const TRADE_OWNER_TOKEN = `storybook.${btoa(JSON.stringify({ memberId: 3 }))}.token`;

const tradeOwnerMemberHandler = http.get('/api/v1/members/me', () =>
  HttpResponse.json({
    code: 'C000',
    message: '요청에 성공했습니다.',
    data: {
      name: '김민지',
      nickname: '가챠러 민지',
      profileImageUrl: null,
      desireTradeLocation: '홍대입구역',
    },
  }),
);

const updateFailureHandler = http.put('/api/v1/trades/:tradeId', () =>
  HttpResponse.json(
    { code: 'TE002', message: '교환 게시글을 수정하지 못했습니다.' },
    { status: 500 },
  ),
);

function TradeOwnerSession({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    storeAuthTokens({
      accessToken: TRADE_OWNER_TOKEN,
      refreshToken: 'storybook-refresh-token',
    });
    setIsReady(true);

    return clearAuthTokens;
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <AuthSessionProvider initialAccessToken={TRADE_OWNER_TOKEN}>
      {children}
    </AuthSessionProvider>
  );
}

function TradeDetailRouteElement() {
  const { tradeId } = useParams<'tradeId'>();

  return <TradeDetailRoute tradeId={Number(tradeId)} />;
}

function TradeEditStory() {
  return (
    <TradeOwnerSession>
      <MemoryRouter initialEntries={['/trade/1/edit']}>
        <Routes>
          <Route
            path="/trade/:tradeId/edit"
            element={<TradeEditRoute tradeId={1} />}
          />
          <Route path="/trade/:tradeId" element={<TradeDetailRouteElement />} />
        </Routes>
      </MemoryRouter>
    </TradeOwnerSession>
  );
}

const meta: Meta<typeof TradeEditRoute> = {
  title: 'routes/trade/TradeEditRoute',
  component: TradeEditRoute,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TradeEditRoute>;

const DEFAULT_HANDLERS = [tradeOwnerMemberHandler, ...tradeHandlers];
const UPDATE_FAILURE_HANDLERS = [
  tradeOwnerMemberHandler,
  updateFailureHandler,
  ...tradeHandlers,
];

export const Default: Story = {
  render: () => (
    <MockWorkerBoundary handlers={DEFAULT_HANDLERS}>
      <TradeEditStory />
    </MockWorkerBoundary>
  ),
};

export const UpdateFailure: Story = {
  render: () => (
    <MockWorkerBoundary handlers={UPDATE_FAILURE_HANDLERS}>
      <TradeEditStory />
    </MockWorkerBoundary>
  ),
};
