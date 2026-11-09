import { describe, expect, it } from '@jest/globals';
import { screen, within } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';

import { PrivacyRoute } from './route';

describe('PrivacyRoute', () => {
  it('현재 서비스의 로그인, 신고, 오류 추적과 회원 탈퇴 정책을 안내한다', () => {
    renderWithProviders(<PrivacyRoute />, { route: '/privacy' });

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '가치가챠 개인정보처리방침',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Apple 로그인')).toBeInTheDocument();
    expect(screen.getByText('회원 신고')).toBeInTheDocument();
    expect(screen.getByText('Sentry')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '외부 회원 탈퇴 페이지' }),
    ).toHaveAttribute('href', '/account-deletion');
  });

  it('모바일 세로 묶음에 쓸 칸 이름을 표의 각 칸에 붙인다', () => {
    renderWithProviders(<PrivacyRoute />, { route: '/privacy' });

    const kakaoRow = screen.getByText('카카오 로그인').closest('tr');

    expect(kakaoRow).not.toBeNull();
    expect(
      within(kakaoRow!)
        .getAllByRole('cell')
        .map((cell) => cell.getAttribute('data-label')),
    ).toEqual(['처리 항목', '수집 방법']);
  });
});
