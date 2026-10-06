import { beforeEach, describe, expect, it } from '@jest/globals';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import {
  AUTH_STORY_REFRESH_TOKEN,
  AUTH_STORY_TOKEN,
  authenticatedMemberHandler,
} from '@/features/auth/mocks/authHandlers';
import { SUPPORT_INSTAGRAM_URL } from '@/shared/contact/supportContact';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { myTradesHandler } from './mocks/myPageHandlers';
import { MyPageRoute } from './route';

describe('MyPageRoute 내 교환글 수정', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
  });

  it('내 교환글마다 삭제 버튼 옆에 수정 화면으로 가는 링크를 보여준다', async () => {
    server.use(authenticatedMemberHandler, myTradesHandler);

    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    const editLink = await screen.findByRole('link', {
      name: '쿠로미 미니 피규어 vol.2 교환해요 수정',
    });
    const deleteButton = screen.getByRole('button', {
      name: '쿠로미 미니 피규어 vol.2 교환해요 삭제',
    });

    expect(editLink).toHaveAttribute('href', '/trade/17/edit');
    expect(editLink.parentElement).toBe(deleteButton.parentElement);
  });

  it('고객센터를 공식 인스타그램 문의로 연결한다', async () => {
    server.use(authenticatedMemberHandler, myTradesHandler);

    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    expect(
      await screen.findByRole('link', { name: /고객센터/ }),
    ).toHaveAttribute('href', SUPPORT_INSTAGRAM_URL);
  });
});

describe('MyPageRoute 내 교환글 상태 변경', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
  });

  it('상태를 변경하면 카드와 진행 중 집계에 즉시 반영한다', async () => {
    const user = userEvent.setup();
    let requestBody: unknown = null;

    server.use(
      authenticatedMemberHandler,
      myTradesHandler,
      http.patch('/api/v1/trades/17/status', async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json({
          code: 'C002',
          message: '정상 수정',
          data: {
            tradeId: 17,
            memberId: 1,
            title: '쿠로미 미니 피규어 vol.2 교환해요',
            description: null,
            desiredProduction: null,
            categories: ['산리오', '피규어'],
            status: 'COMPLETED',
            purchaseStore: null,
            tradePlace: null,
            availableTime: null,
            imageUrls: [],
            createdAt: '2026-09-25T19:30:00',
            updatedAt: '2026-10-06T17:00:00',
          },
        });
      }),
    );

    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    const inProgressSummary = (await screen.findByText('진행 중 교환')).closest(
      'article',
    );

    expect(inProgressSummary).not.toBeNull();
    expect(within(inProgressSummary!).getByText('1')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: '쿠로미 미니 피규어 vol.2 교환해요 교환 상태: 교환 진행 중',
      }),
    );
    await user.click(screen.getByRole('menuitemradio', { name: '교환 완료' }));

    expect(requestBody).toEqual({ status: 'COMPLETED' });
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: '쿠로미 미니 피규어 vol.2 교환해요 교환 상태: 교환 완료',
        }),
      ).toBeInTheDocument();
      expect(within(inProgressSummary!).getByText('0')).toBeInTheDocument();
    });
  });
});

describe('MyPageRoute 내 교환글 삭제', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
  });

  it('삭제를 확인하면 해당 글을 삭제하고 내 교환글을 다시 불러온다', async () => {
    const user = userEvent.setup();
    const deletedTradeIds: string[] = [];
    let myTradesRequestCount = 0;

    server.use(
      authenticatedMemberHandler,
      http.get('/api/v1/trades/me', () => {
        myTradesRequestCount += 1;
      }),
      myTradesHandler,
      http.delete('/api/v1/trades/:tradeId', ({ params }) => {
        deletedTradeIds.push(String(params.tradeId));

        return HttpResponse.json({ code: 'C003', message: '정상 삭제' });
      }),
    );

    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    await user.click(
      await screen.findByRole('button', {
        name: '쿠로미 미니 피규어 vol.2 교환해요 삭제',
      }),
    );

    const dialog = screen.getByRole('alertdialog', {
      name: '교환 글을 삭제할까요?',
    });
    const requestCountBeforeDelete = myTradesRequestCount;

    expect(dialog).toHaveAccessibleDescription(
      "'쿠로미 미니 피규어 vol.2 교환해요' 글을 삭제하면 되돌릴 수 없어요.",
    );

    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(deletedTradeIds).toEqual(['17']);
    await waitFor(() => {
      expect(myTradesRequestCount).toBeGreaterThan(requestCountBeforeDelete);
    });
  });

  it('삭제에 실패하면 확인 창에 오류를 보여주고 닫지 않는다', async () => {
    const user = userEvent.setup();

    server.use(
      authenticatedMemberHandler,
      myTradesHandler,
      http.delete('/api/v1/trades/:tradeId', () =>
        HttpResponse.json(
          { code: 'T003', message: '작성자만 삭제할 수 있습니다.' },
          { status: 403 },
        ),
      ),
    );

    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    await user.click(
      await screen.findByRole('button', {
        name: '쿠로미 미니 피규어 vol.2 교환해요 삭제',
      }),
    );

    const dialog = screen.getByRole('alertdialog');

    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      '작성자만 삭제할 수 있습니다.',
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
