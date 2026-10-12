import type { ReactNode } from 'react';
import styled from '@emotion/styled';

import { color, fontWeight, space } from '@/shared/styles/tokens';

export interface SearchHeroLayoutProps {
  title: string;
  children: ReactNode;
}

export function SearchHeroLayout({ title, children }: SearchHeroLayoutProps) {
  return (
    <Hero>
      <Title>{title}</Title>
      <SearchArea>{children}</SearchArea>
    </Hero>
  );
}

const Hero = styled.section`
  display: flex;
  padding: ${space.xxl} ${space.xl};
  align-items: center;
  flex-direction: column;
  gap: ${space.lg};
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: 20px;
  font-weight: ${fontWeight.bold};
`;

const SearchArea = styled.div`
  width: 100%;
  max-width: 500px;
`;
