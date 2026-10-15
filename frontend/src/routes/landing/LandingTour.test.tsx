import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import LandingTour from './LandingTour';

describe('LandingTour', () => {
  it('대표 서비스 소개 문구는 첫 단계에만 보여준다', () => {
    const { rerender } = render(<LandingTour stepIndex={0} />);

    expect(screen.getByText('가치가챠')).toBeInTheDocument();
    expect(screen.getByText(/중복 굿즈는 가까운 사람과/)).toBeInTheDocument();

    rerender(<LandingTour stepIndex={1} />);

    expect(screen.queryByText('가치가챠')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/중복 굿즈는 가까운 사람과/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '원하는 가챠를 지도에서 찾아보세요!',
      }),
    ).toBeInTheDocument();
  });
});
