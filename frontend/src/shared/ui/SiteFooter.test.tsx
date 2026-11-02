import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { SUPPORT_INSTAGRAM_URL } from '@/shared/contact/supportContact';

import { shouldShowSiteFooter, SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('실제로 제공하는 정책과 문의 링크만 표시한다', () => {
    render(
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: '개인정보 처리방침' }),
    ).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: '협업 문의' })).toHaveAttribute(
      'href',
      SUPPORT_INSTAGRAM_URL,
    );
    expect(screen.getByRole('link', { name: '고객센터' })).toHaveAttribute(
      'href',
      SUPPORT_INSTAGRAM_URL,
    );
    expect(
      screen.queryByRole('link', { name: '이용약관' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '회원 탈퇴' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('© 2026 GachiGacha. 전국의 가챠를 한 곳에서.'),
    ).toBeInTheDocument();
  });

  it.each([
    '/trade',
    '/trade/15',
    '/search',
    '/stores/7',
    '/privacy',
    '/account-deletion',
    '/mypage',
  ])('%s 일반 콘텐츠 경로에는 푸터를 표시한다', (pathname) => {
    expect(shouldShowSiteFooter(pathname)).toBe(true);
  });

  it.each([
    '/',
    '/map',
    '/chat',
    '/chat/15',
    '/chat/start/15',
    '/oauth/login/kakao',
    '/oauth/callback',
    '/oauth/withdraw-callback',
  ])('%s 전체 화면·전환 경로에는 푸터를 표시하지 않는다', (pathname) => {
    expect(shouldShowSiteFooter(pathname)).toBe(false);
  });
});
