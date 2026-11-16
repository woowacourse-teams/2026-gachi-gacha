import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import {
  LAUNCH_EVENT_ID,
  LAUNCH_EVENT_SCHEMA_VERSION,
  type LaunchEventConfig,
  type LaunchEventMetadata,
} from '@/features/launchEvent/launchEventConfig';
import { server } from '@/test/server';

import { LaunchEventRoute } from './route';

const ENDPOINT = '/event-api/launch-event';
const MEMBER_ID = 710;
const ACCESS_TOKEN = `synthetic.${btoa(JSON.stringify({ memberId: MEMBER_ID }))}.not-a-real-signature`;
const REFRESH_TOKEN = 'synthetic-refresh-not-a-real-token';
const SUBMISSION_ID = '71000000-1234-4234-9234-123456789012';
const TRADE_IDS = Array.from({ length: 103 }, (_, index) => 1001 + index);
const CONFIG: LaunchEventConfig = {
  enabled: true,
  endpoint: ENDPOINT,
  campaignId: LAUNCH_EVENT_ID,
  startAt: '2020-01-01T00:00:00+09:00',
  endAt: '2099-11-28T00:00:00+09:00',
};

// 승인된 정책 문구를 사용하되 일정·토큰·회원·응답은 합성 테스트 데이터다.
const METADATA: LaunchEventMetadata = {
  eventId: LAUNCH_EVENT_ID,
  schemaVersion: LAUNCH_EVENT_SCHEMA_VERSION,
  authentication: 'server-verified',
  accepting: true,
  startAt: CONFIG.startAt,
  endAt: CONFIG.endAt,
  rulesVersion: 'synthetic-test-only',
  privacy: {
    controller: '가치가챠팀',
    contact: 'Instagram @gachi__.gacha',
    purpose:
      '이벤트 응모 자격 및 참여 활동 확인, 중복 응모 관리, 추첨, 인스타그램 DM을 통한 당첨 안내 및 경품 전달',
    items: [
      '회원번호',
      '이름',
      '인스타그램 ID',
      '교환글 수 및 ID 목록',
      '동의 및 접수 기록',
    ],
    retentionDays: 30,
  },
};

const originalUuid = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);

beforeAll(() => {
  Object.defineProperty(crypto, 'randomUUID', {
    configurable: true,
    value: () => SUBMISSION_ID,
  });
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = true;
      },
    },
    close: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = false;
      },
    },
  });
});

afterAll(() => {
  for (const [target, property, descriptor] of [
    [crypto, 'randomUUID', originalUuid],
    [HTMLDialogElement.prototype, 'showModal', originalShowModal],
    [HTMLDialogElement.prototype, 'close', originalClose],
  ] as const) {
    if (descriptor) Object.defineProperty(target, property, descriptor);
    else Reflect.deleteProperty(target, property);
  }
});

function setup(rejectSubmission = false) {
  const memberRequests: Request[] = [];
  const tradeRequests: Request[] = [];
  const relayRequests: Request[] = [];
  const submittedBodies: unknown[] = [];
  const requestedPages: number[] = [];

  // 공통 setup의 onUnhandledRequest: 'error'가 아래에 없는 요청을 차단한다.
  // 중계 서버는 MSW로 대체한다. 서버의 인증·서명 검증은 별도 Node/GAS 테스트 대상이다.
  server.use(
    http.get('/api/v1/members/me', ({ request }) => {
      memberRequests.push(request);
      return HttpResponse.json({
        code: 'C000',
        message: '합성 회원',
        data: {
          name: '합성 회원',
          nickname: '합성 테스트 계정',
          profileImageUrl: null,
          desireTradeLocation: null,
        },
      });
    }),
    http.get('/api/v1/trades/me', ({ request }) => {
      tradeRequests.push(request);
      const page = Number(new URL(request.url).searchParams.get('page'));
      requestedPages.push(page);
      return HttpResponse.json({
        code: 'C000',
        message: '합성 게시글',
        data: {
          content: TRADE_IDS.slice(page * 100, (page + 1) * 100).map(
            (tradeId) => ({
              tradeId,
              memberId: MEMBER_ID,
              status: ['AVAILABLE', 'IN_PROGRESS', 'COMPLETED'][tradeId % 3],
            }),
          ),
          number: page,
          size: 100,
          totalElements: TRADE_IDS.length,
          totalPages: 2,
          last: page === 1,
        },
      });
    }),
    http.get(ENDPOINT, ({ request }) => {
      relayRequests.push(request);
      return HttpResponse.json({ ok: true, ...METADATA });
    }),
    http.post(ENDPOINT, async ({ request }) => {
      relayRequests.push(request);
      submittedBodies.push(await request.json());
      return HttpResponse.json(
        rejectSubmission
          ? { ok: false, code: 'POLICY_CHANGED' }
          : {
              ok: true,
              eventId: LAUNCH_EVENT_ID,
              submissionId: SUBMISSION_ID,
              receivedAt: '2026-11-16T12:00:00.000Z',
            },
      );
    }),
  );

  storeAuthTokens({ accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN });
  render(
    <MemoryRouter initialEntries={['/events/app-launch']}>
      <AuthSessionProvider>
        <LaunchEventRoute config={CONFIG} />
      </AuthSessionProvider>
    </MemoryRouter>,
  );

  return {
    user: userEvent.setup(),
    memberRequests,
    tradeRequests,
    relayRequests,
    submittedBodies,
    requestedPages,
  };
}

async function openAndFill(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '응모하기' }));
  const form = screen.getByRole('form', { name: '가치가챠 이벤트 응모' });
  await user.type(
    within(form).getByRole('textbox', { name: '이름' }),
    '  합성 참여자  ',
  );
  await user.type(
    within(form).getByRole('textbox', { name: '인스타그램 아이디' }),
    '@Synthetic.Participant',
  );
  return form;
}

describe('이벤트 응모 합성 통합 흐름', () => {
  it('인증·폼·사전 확인 후 중계 서버에 제출하고 확인된 영수증으로 완료 화면을 표시한다', async () => {
    const {
      user,
      memberRequests,
      tradeRequests,
      relayRequests,
      submittedBodies,
      requestedPages,
    } = setup();
    const form = await openAndFill(user);
    await user.click(
      within(form).getByRole('button', {
        name: '개인정보 수집·이용 내용 보기',
      }),
    );
    const dialog = screen.getByRole('dialog', {
      name: '개인정보 수집·이용 동의',
    });
    expect(
      within(dialog).getByText('개인정보 처리자: 가치가챠팀'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('문의: Instagram @gachi__.gacha'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(`이용 목적: ${METADATA.privacy.purpose}`),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        `수집 항목: ${METADATA.privacy.items.join(', ')}`,
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/이벤트 종료 후 30일/)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/동의를 거부할 수 있지만/),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '확인' }));

    const submit = within(form).getByRole('button', { name: '응모하기' });
    expect(submit).toBeDisabled();
    expect(tradeRequests).toHaveLength(0);
    expect(submittedBodies).toHaveLength(0);
    await user.click(
      within(form).getByRole('checkbox', {
        name: '[필수] 개인정보 수집·이용 동의',
      }),
    );
    expect(submit).toBeDisabled();
    await user.click(
      within(form).getByRole('checkbox', {
        name: '[필수] 참여 조건·유의사항 확인',
      }),
    );
    await user.click(submit);

    expect(
      await screen.findByRole('heading', { name: '응모가 완료됐어요' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '응모 완료', level: 1 }),
    ).toHaveFocus();
    expect(screen.getByText(SUBMISSION_ID)).toBeInTheDocument();
    expect(screen.getByText(/11\. 16\. 21:00/)).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '홈으로 돌아가기' }),
    ).toBeEnabled();

    expect(memberRequests).toHaveLength(1);
    expect(requestedPages).toEqual([0, 1]);
    for (const request of [...memberRequests, ...tradeRequests]) {
      expect(request.headers.get('authorization')).toBe(
        `Bearer ${ACCESS_TOKEN}`,
      );
    }
    for (const request of tradeRequests) {
      const url = new URL(request.url);
      expect(url.searchParams.get('size')).toBe('100');
      expect(url.searchParams.has('status')).toBe(false);
    }
    expect(submittedBodies).toEqual([
      {
        eventId: LAUNCH_EVENT_ID,
        schemaVersion: LAUNCH_EVENT_SCHEMA_VERSION,
        submissionId: SUBMISSION_ID,
        expectedMemberId: String(MEMBER_ID),
        name: '합성 참여자',
        instagramId: 'synthetic.participant',
        privacyConsent: true,
        rulesConsent: true,
        rulesVersion: 'synthetic-test-only',
      },
    ]);
    expect(relayRequests.map((request) => request.method)).toEqual([
      'GET',
      'POST',
    ]);
    for (const request of relayRequests) {
      expect(request.headers.get('authorization')).toBe(
        request.method === 'POST' ? `Bearer ${ACCESS_TOKEN}` : null,
      );
      expect(request.headers.get('cookie')).toBeNull();
      expect(request.credentials).toBe('omit');
      expect(request.referrerPolicy).toBe('no-referrer');
      expect(request.url).toBe(new URL(ENDPOINT, window.location.origin).href);
    }
    expect(JSON.stringify(submittedBodies)).not.toContain(ACCESS_TOKEN);
    expect(JSON.stringify(submittedBodies)).not.toContain(REFRESH_TOKEN);
  });

  it('접수가 거절되면 완료 화면을 열지 않고 입력과 재시도 버튼을 유지한다', async () => {
    const { user, submittedBodies, requestedPages } = setup(true);
    const form = await openAndFill(user);
    await user.click(within(form).getByRole('checkbox', { name: '전체 동의' }));
    await user.click(within(form).getByRole('button', { name: '응모하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '응모 접수 결과를 확인하지 못했어요.',
    );
    expect(
      screen.queryByRole('heading', { name: '응모가 완료됐어요' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(SUBMISSION_ID)).not.toBeInTheDocument();
    expect(within(form).getByRole('textbox', { name: '이름' })).toHaveValue(
      '  합성 참여자  ',
    );
    expect(
      within(form).getByRole('textbox', { name: '인스타그램 아이디' }),
    ).toHaveValue('@Synthetic.Participant');
    expect(
      within(form).getByRole('button', { name: '응모하기' }),
    ).toBeEnabled();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '이벤트 상세로 돌아가기' }),
      ).toBeEnabled(),
    );
    expect(requestedPages).toEqual([0, 1]);
    expect(submittedBodies).toHaveLength(1);
  });
});
