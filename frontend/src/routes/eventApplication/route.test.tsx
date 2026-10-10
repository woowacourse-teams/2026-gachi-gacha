import { describe, expect, it, jest } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { RequireAuth } from '@/features/auth/RequireAuth';
import type { EventApplicationConfig } from '@/features/eventApplication/eventApplicationConfig';
import type { EventApplicationInput } from '@/features/eventApplication/eventApplicationType';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { EventApplicationRoute } from './route';

const ACCESS_TOKEN = `header.${btoa(JSON.stringify({ memberId: 37 }))}.signature`;
const OPEN_CONFIG = {
  enabled: true,
  endpoint: 'https://script.google.com/macros/s/test/exec',
  startAt: '2026-10-01T00:00:00+09:00',
  endAt: '2026-11-01T00:00:00+09:00',
} satisfies EventApplicationConfig;

function useAuthenticatedMember() {
  server.use(
    http.get('/api/v1/members/me', ({ request }) => {
      if (request.headers.get('Authorization') !== `Bearer ${ACCESS_TOKEN}`) {
        return HttpResponse.json({}, { status: 401 });
      }

      return HttpResponse.json({
        code: 'C000',
        message: '요청에 성공했습니다.',
        data: {
          name: '김민지',
          nickname: '가챠러 민지',
          profileImageUrl: null,
          desireTradeLocation: null,
        },
      });
    }),
  );
}

describe('EventApplicationRoute', () => {
  it('확정된 일정과 A·B·두 트랙 모두 응모 선택지를 안내한다', async () => {
    useAuthenticatedMember();
    const user = userEvent.setup();

    renderWithProviders(
      <RequireAuth>
        <EventApplicationRoute
          config={OPEN_CONFIG}
          now={new Date('2026-10-10T12:00:00+09:00')}
        />
      </RequireAuth>,
      { initialAccessToken: ACCESS_TOKEN },
    );

    expect(await screen.findByText('10/10 (토)')).toBeInTheDocument();
    expect(screen.getByText('10/16 (금) 오후 11:59분')).toBeInTheDocument();
    expect(screen.getByText('10/31 (토)')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(
      screen.getByRole('radio', { name: /이벤트 A 트랙/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /이벤트 B 트랙/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /두 트랙 모두/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByText('두 트랙 모두'));
    expect(screen.getByRole('radio', { name: /두 트랙 모두/ })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /이벤트 A 트랙/ }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('radio', { name: /이벤트 B 트랙/ }),
    ).not.toBeChecked();
  });

  it('로그인한 회원 ID와 입력한 응모 정보를 함께 제출한다', async () => {
    useAuthenticatedMember();
    const user = userEvent.setup();
    const submitApplication = jest
      .fn<(input: EventApplicationInput) => Promise<void>>()
      .mockResolvedValue(undefined);

    renderWithProviders(
      <RequireAuth>
        <EventApplicationRoute
          config={OPEN_CONFIG}
          now={new Date('2026-10-10T12:00:00+09:00')}
          submitApplication={submitApplication}
        />
      </RequireAuth>,
      {
        initialAccessToken: ACCESS_TOKEN,
        route: '/events/popular-goods',
      },
    );

    await user.click(
      await screen.findByRole('radio', { name: /두 트랙 모두/ }),
    );
    await user.type(screen.getByLabelText('인스타그램 ID'), '@gachi__.gacha');
    await user.type(
      screen.getByLabelText('본인이 작성한 거래글 링크'),
      'https://gachigacha.kro.kr/trade/153',
    );
    await user.type(
      screen.getByLabelText(/거래 완료글 링크/),
      'https://gachigacha.kro.kr/trade/207?from=event',
    );
    await user.click(
      screen.getByRole('checkbox', { name: /개인정보처리방침/ }),
    );
    await user.click(screen.getByRole('button', { name: '응모 제출하기' }));

    await waitFor(() => {
      expect(submitApplication).toHaveBeenCalledWith({
        eventId: 'popular-goods-giveaway-2026',
        memberId: '37',
        desiredTrack: 'BOTH',
        instagramId: 'gachi__.gacha',
        tradeId: 153,
        tradeUrl: 'https://gachigacha.kro.kr/trade/153',
        completedTradeId: 207,
        completedTradeUrl: 'https://gachigacha.kro.kr/trade/207',
        privacyConsent: true,
      });
    });
    expect(
      screen.getByRole('heading', { name: '이벤트 응모를 접수했어요!' }),
    ).toBeInTheDocument();
  });

  it('B 트랙은 거래 완료글 링크가 없으면 제출하지 않는다', async () => {
    useAuthenticatedMember();
    const user = userEvent.setup();
    const submitApplication = jest.fn<() => Promise<void>>();

    renderWithProviders(
      <RequireAuth>
        <EventApplicationRoute
          config={OPEN_CONFIG}
          now={new Date('2026-10-10T12:00:00+09:00')}
          submitApplication={submitApplication}
        />
      </RequireAuth>,
      { initialAccessToken: ACCESS_TOKEN },
    );

    await user.click(
      await screen.findByRole('radio', { name: /이벤트 B 트랙/ }),
    );
    await user.type(screen.getByLabelText('인스타그램 ID'), 'tester');
    await user.type(
      screen.getByLabelText('본인이 작성한 거래글 링크'),
      'https://gachigacha.kro.kr/trade/153',
    );
    await user.click(
      screen.getByRole('checkbox', { name: /개인정보처리방침/ }),
    );
    await user.click(screen.getByRole('button', { name: '응모 제출하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'B 트랙 응모를 위한 거래 완료글 링크',
    );
    expect(submitApplication).not.toHaveBeenCalled();
  });

  it('A 트랙은 거래 완료글 링크 없이 제출할 수 있다', async () => {
    useAuthenticatedMember();
    const user = userEvent.setup();
    const submitApplication = jest
      .fn<(input: EventApplicationInput) => Promise<void>>()
      .mockResolvedValue(undefined);

    renderWithProviders(
      <RequireAuth>
        <EventApplicationRoute
          config={OPEN_CONFIG}
          now={new Date('2026-10-10T12:00:00+09:00')}
          submitApplication={submitApplication}
        />
      </RequireAuth>,
      { initialAccessToken: ACCESS_TOKEN },
    );

    await user.click(
      await screen.findByRole('radio', { name: /이벤트 A 트랙/ }),
    );
    await user.type(screen.getByLabelText('인스타그램 ID'), 'tester');
    await user.type(
      screen.getByLabelText('본인이 작성한 거래글 링크'),
      'https://gachigacha.kro.kr/trade/153',
    );
    await user.click(
      screen.getByRole('checkbox', { name: /개인정보처리방침/ }),
    );
    await user.click(screen.getByRole('button', { name: '응모 제출하기' }));

    await waitFor(() => {
      expect(submitApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          desiredTrack: 'BASIC',
          completedTradeId: null,
          completedTradeUrl: null,
        }),
      );
    });
  });

  it('가치가챠 거래글이 아닌 링크는 제출하지 않는다', async () => {
    useAuthenticatedMember();
    const user = userEvent.setup();
    const submitApplication = jest.fn<() => Promise<void>>();

    renderWithProviders(
      <RequireAuth>
        <EventApplicationRoute
          config={OPEN_CONFIG}
          now={new Date('2026-10-10T12:00:00+09:00')}
          submitApplication={submitApplication}
        />
      </RequireAuth>,
      { initialAccessToken: ACCESS_TOKEN },
    );

    await user.click(
      await screen.findByRole('radio', { name: /이벤트 A 트랙/ }),
    );
    await user.type(screen.getByLabelText('인스타그램 ID'), 'tester');
    await user.type(
      screen.getByLabelText('본인이 작성한 거래글 링크'),
      'https://example.com/trade/153',
    );
    await user.click(
      screen.getByRole('checkbox', { name: /개인정보처리방침/ }),
    );
    await user.click(screen.getByRole('button', { name: '응모 제출하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '본인이 작성한 가치가챠 거래글 링크',
    );
    expect(submitApplication).not.toHaveBeenCalled();
  });

  it('응모 기간이 아니면 입력 폼을 노출하지 않는다', async () => {
    useAuthenticatedMember();

    renderWithProviders(
      <RequireAuth>
        <EventApplicationRoute
          config={OPEN_CONFIG}
          now={new Date('2026-11-02T00:00:00+09:00')}
        />
      </RequireAuth>,
      { initialAccessToken: ACCESS_TOKEN },
    );

    expect(
      await screen.findByRole('heading', {
        name: '이벤트 응모가 종료되었어요',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '응모 제출하기' }),
    ).not.toBeInTheDocument();
  });
});
