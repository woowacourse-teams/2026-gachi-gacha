import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';

import { UpdatesRoute } from './route';

describe('UpdatesRoute', () => {
  it('운영에 공개된 서비스 버전을 최신순으로 안내한다', () => {
    renderWithProviders(<UpdatesRoute />, { route: '/updates' });

    expect(
      screen.getByRole('heading', { name: '조금씩 더 좋아지고 있어요' }),
    ).toBeInTheDocument();
    expect(screen.getByText('최신 공개 버전')).toBeInTheDocument();

    const versionLabels = screen
      .getAllByText(/^v1\.[0-5]\.0$/)
      .map((element) => element.textContent);

    expect(versionLabels).toEqual([
      'v1.5.0',
      'v1.4.0',
      'v1.3.0',
      'v1.2.0',
      'v1.1.0',
      'v1.0.0',
    ]);
    expect(
      screen.getAllByRole('link', { name: '전체 변경 기록 보기' }),
    ).toHaveLength(6);
  });
});
