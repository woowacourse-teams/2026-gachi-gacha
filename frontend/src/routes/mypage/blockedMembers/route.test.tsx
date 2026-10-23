import { beforeEach, describe, expect, it } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { MemberBlockProvider } from '@/features/memberSafety/MemberBlockContext';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { BlockedMembersRoute } from './route';

beforeEach(() => {
  window.localStorage.clear();
  storeAuthTokens({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  });
});

describe('BlockedMembersRoute', () => {
  it('차단한 사용자를 보여주고 목록에서 해제한다', async () => {
    const user = userEvent.setup();
    let deletedMemberId = '';

    server.use(
      http.get('/api/v1/blocks', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            blocks: [
              {
                memberId: 27,
                nickname: '차단한 가챠러',
                blockedAt: '2026-10-20T09:00:00',
              },
            ],
          },
        }),
      ),
      http.delete('/api/v1/blocks/:memberId', ({ params }) => {
        deletedMemberId = String(params.memberId);
        return HttpResponse.json({ code: 'C003', message: '차단 해제 완료' });
      }),
    );

    renderWithProviders(
      <MemberBlockProvider>
        <BlockedMembersRoute />
      </MemberBlockProvider>,
      { initialAccessToken: null, route: '/mypage/blocked-members' },
    );

    expect(await screen.findByText('차단한 가챠러')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '차단 해제' }));

    await waitFor(() => expect(deletedMemberId).toBe('27'));
    expect(screen.getByText('차단한 사용자가 없어요')).toBeInTheDocument();
  });
});
