import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import {
  readAccessToken,
  readRefreshToken,
  storeAuthTokens,
} from '@/features/auth/authTokenStorage';
import {
  AUTH_STORY_REFRESH_TOKEN,
  AUTH_STORY_TOKEN,
  authenticatedMemberHandler,
} from '@/features/auth/mocks/authHandlers';
import {
  assignBrowserLocation,
  replaceBrowserLocation,
} from '@/shared/browser/browserNavigation';
import { SUPPORT_INSTAGRAM_URL } from '@/shared/contact/supportContact';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

import { SERVICE_VERSION } from './components/MyPageMenu';
import { myTradesHandler } from './mocks/myPageHandlers';
import { MyPageRoute } from './route';

jest.mock('@/shared/browser/browserNavigation', () => ({
  assignBrowserLocation: jest.fn(),
  replaceBrowserLocation: jest.fn(),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});

describe('MyPageRoute 회원 탈퇴', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
  });

  it('확인 문구를 제출하면 웹 OAuth 탈퇴 API를 호출하고 토큰을 지운 뒤 거래 목록으로 이동한다', async () => {
    const user = userEvent.setup();
    const authorizations: Array<string | null> = [];

    server.use(
      authenticatedMemberHandler,
      myTradesHandler,
      http.delete('/api/v1/oauth/withdraw', ({ request }) => {
        authorizations.push(request.headers.get('Authorization'));
        return HttpResponse.json({ code: 'C003', message: '정상 삭제' });
      }),
    );

    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    await user.click(await screen.findByRole('button', { name: /회원 탈퇴/ }));
    const dialog = screen.getByRole('dialog', { name: '회원 탈퇴' });
    const confirmationInput = within(dialog).getByRole('textbox', {
      name: /^확인 문구/,
    });
    await user.type(confirmationInput, '탈퇴');
    await user.click(within(dialog).getByRole('button', { name: '회원 탈퇴' }));

    await waitFor(() => {
      expect(replaceBrowserLocation).toHaveBeenCalledWith('/trade');
    });
    expect(authorizations).toEqual([`Bearer ${AUTH_STORY_TOKEN}`]);
    expect(readAccessToken()).toBeNull();
    expect(readRefreshToken()).toBeNull();
    expect(assignBrowserLocation).not.toHaveBeenCalled();
  });

  it('405 응답이면 탈퇴 창과 입력·토큰을 유지하고 페이지를 이동하지 않는다', async () => {
    const user = userEvent.setup();

    server.use(
      authenticatedMemberHandler,
      myTradesHandler,
      http.delete('/api/v1/oauth/withdraw', () =>
        HttpResponse.json(
          { code: 'CE002', message: '지원하지 않는 HTTP 메서드입니다.' },
          { status: 405 },
        ),
      ),
    );

    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    await user.click(await screen.findByRole('button', { name: /회원 탈퇴/ }));
    const dialog = screen.getByRole('dialog', { name: '회원 탈퇴' });
    const confirmationInput = within(dialog).getByRole('textbox', {
      name: /^확인 문구/,
    });
    await user.type(confirmationInput, '탈퇴');
    await user.click(within(dialog).getByRole('button', { name: '회원 탈퇴' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      '지원하지 않는 HTTP 메서드입니다.',
    );
    expect(
      screen.getByRole('dialog', { name: '회원 탈퇴' }),
    ).toBeInTheDocument();
    expect(confirmationInput).toHaveValue('탈퇴');
    expect(
      within(dialog).getByRole('button', { name: '회원 탈퇴' }),
    ).toBeEnabled();
    expect(readAccessToken()).toBe(AUTH_STORY_TOKEN);
    expect(readRefreshToken()).toBe(AUTH_STORY_REFRESH_TOKEN);
    expect(replaceBrowserLocation).not.toHaveBeenCalled();
    expect(assignBrowserLocation).not.toHaveBeenCalled();
  });
});

describe('MyPageRoute 웹 메뉴와 내 글', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
    server.use(authenticatedMemberHandler, myTradesHandler);
  });

  it('왼쪽 메뉴에서 내 글을 선택한 상태로 내 글 카드를 보여준다', async () => {
    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    const menu = await screen.findByRole('navigation', { name: '마이 메뉴' });

    expect(
      within(menu).getByRole('link', { name: '내 글', current: 'page' }),
    ).toHaveAttribute('href', '/mypage/trades');
    expect(screen.getByRole('heading', { name: '내 글' })).toBeInTheDocument();
    expect(
      await screen.findByRole('link', {
        name: /쿠로미 미니 피규어 vol\.2 교환해요/,
      }),
    ).toHaveAttribute('href', '/trade/17');
  });

  it('닉네임만 보여주고 가입 시 실명은 노출하지 않는다', async () => {
    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    expect(await screen.findByText('가챠러 민지')).toBeInTheDocument();
    expect(screen.queryByText('김민지')).not.toBeInTheDocument();
  });

  it('메뉴를 시안 순서대로 묶고 각 화면으로 연결한다', async () => {
    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    const menu = await screen.findByRole('navigation', { name: '마이 메뉴' });

    expect(
      within(menu)
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual(['내 활동', '사용자 관리', '고객 지원', '앱 정보', '계정']);
    expect(
      within(menu).getByRole('link', { name: '차단한 사용자' }),
    ).toHaveAttribute('href', '/mypage/blocked-members');
    expect(
      within(menu).getByRole('link', { name: '고객센터' }),
    ).toHaveAttribute('href', SUPPORT_INSTAGRAM_URL);
    expect(
      within(menu).getByRole('link', { name: '협업 문의' }),
    ).toHaveAttribute('href', SUPPORT_INSTAGRAM_URL);
    expect(
      within(menu).getByRole('link', { name: '업데이트 소식' }),
    ).toHaveAttribute('href', '/updates');
    expect(
      within(menu).getByRole('link', { name: '개인정보 처리방침' }),
    ).toHaveAttribute('href', '/privacy');
    expect(within(menu).getByText(SERVICE_VERSION)).toBeInTheDocument();
    expect(SERVICE_VERSION).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('홈으로 옮긴 이벤트의 이전 응모 링크를 마이페이지에 표시하지 않는다', async () => {
    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    await screen.findByRole('link', { name: '차단한 사용자' });
    expect(
      screen.queryByRole('link', { name: /이벤트 응모/ }),
    ).not.toBeInTheDocument();
  });

  it('로그아웃은 확인한 뒤에만 토큰을 지우고 이동한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    await user.click(await screen.findByRole('button', { name: '로그아웃' }));

    const dialog = screen.getByRole('alertdialog', { name: '로그아웃할까요?' });

    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(readAccessToken()).toBe(AUTH_STORY_TOKEN);
    expect(replaceBrowserLocation).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await user.click(
      within(
        screen.getByRole('alertdialog', { name: '로그아웃할까요?' }),
      ).getByRole('button', { name: '로그아웃' }),
    );

    expect(replaceBrowserLocation).toHaveBeenCalledWith('/trade');
    expect(readAccessToken()).toBeNull();
  });
});

describe('MyPageRoute 모바일 마이 탭', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: AUTH_STORY_TOKEN,
      refreshToken: AUTH_STORY_REFRESH_TOKEN,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('프로필과 메뉴 목록만 보여주고 내 글은 별도 화면으로 연결한다', async () => {
    let myTradesRequestCount = 0;

    server.use(
      authenticatedMemberHandler,
      http.get('/api/v1/trades/me', () => {
        myTradesRequestCount += 1;
      }),
      myTradesHandler,
    );

    renderWithProviders(<MyPageRoute />, {
      initialAccessToken: AUTH_STORY_TOKEN,
      route: '/mypage',
    });

    const menu = await screen.findByRole('navigation', { name: '마이 메뉴' });

    expect(within(menu).getByRole('link', { name: '내 글' })).toHaveAttribute(
      'href',
      '/mypage/trades',
    );
    expect(
      within(menu).getByRole('button', { name: '프로필 수정' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '내 글' }),
    ).not.toBeInTheDocument();
    expect(myTradesRequestCount).toBe(0);
  });
});
