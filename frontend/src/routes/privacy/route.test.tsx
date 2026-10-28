import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import { PrivacyRoute } from './route';

describe('PrivacyRoute', () => {
  it('현재 서비스의 로그인, 신고, 오류 추적과 회원 탈퇴 정책을 안내한다', () => {
    render(<PrivacyRoute />);

    expect(screen.getByText('Apple 로그인')).toBeInTheDocument();
    expect(screen.getByText('회원 신고')).toBeInTheDocument();
    expect(screen.getByText('Sentry')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '외부 회원 탈퇴 페이지' }),
    ).toHaveAttribute('href', '/account-deletion');
  });
});
