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

  it('앱 출시 이벤트 v2의 수집 항목과 조기 삭제·최대 보관기간을 안내한다', () => {
    renderWithProviders(<PrivacyRoute />, { route: '/privacy' });

    const eventRow = screen.getByRole('row', { name: /^이벤트 응모 / });
    expect(eventRow).toHaveTextContent('이름, Instagram ID, 회원번호');
    expect(eventRow).toHaveTextContent('교환글 전체 ID와 개수');
    expect(eventRow).toHaveTextContent('동의문 버전·접수번호·접수 시각');
    expect(eventRow).toHaveTextContent('로그인한 회원');
    expect(eventRow).not.toHaveTextContent('희망 트랙');
    expect(eventRow).not.toHaveTextContent('교환글 링크');

    const retentionRow = screen.getByRole('row', {
      name: /^이벤트 응모정보 /,
    });
    expect(retentionRow).toHaveTextContent('경품 전달 완료 후 지체 없이 삭제');
    expect(retentionRow).toHaveTextContent('최대 이벤트 종료 후 30일까지');
    expect(
      screen.getByText(/앱 출시 이벤트의 개인정보 처리 주체는/),
    ).toHaveTextContent('가치가챠팀');
    expect(screen.getByText(/공식 Instagram @gachi__.gacha/)).toHaveTextContent(
      '다른 서비스 기능 이용에는 영향을 주지 않습니다.',
    );
    expect(screen.getByText(/최근 변경 및 시행일:/)).toHaveTextContent(
      '2026년 11월 16일',
    );
  });

  it('Google 이전 항목·목적·기간도 이벤트 v2와 일치하고 신고 정책은 유지한다', () => {
    renderWithProviders(<PrivacyRoute />, { route: '/privacy' });

    const googleHeading = screen.getByRole('heading', {
      name: 'Google Sheets',
    });
    const googleTable = googleHeading.nextElementSibling;
    expect(googleTable).not.toBeNull();
    expect(googleTable).toHaveTextContent('교환글 전체 ID와 개수');
    expect(googleTable).toHaveTextContent('중복 응모 관리');
    expect(googleTable).toHaveTextContent('인스타그램 DM');
    expect(googleTable).toHaveTextContent('최대 이벤트 종료 후 30일까지');
    expect(googleTable).not.toHaveTextContent('희망 트랙');
    expect(googleTable).toHaveTextContent('신고 처리 완료 후 1년까지');
    expect(googleTable).toHaveTextContent('신고자·대상 회원 식별값');
  });
});
