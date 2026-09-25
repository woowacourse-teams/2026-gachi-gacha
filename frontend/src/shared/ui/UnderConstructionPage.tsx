import type { ReactNode } from 'react';

import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';

import {
  Content,
  Description,
  Eyebrow,
  Logo,
  Main,
  Page,
  SearchLink,
  Title,
} from './UnderConstructionPage.styles';

export interface UnderConstructionPageProps {
  title: string;
  description: string;
  header?: ReactNode;
}

export function UnderConstructionPage({
  title,
  description,
  header,
}: UnderConstructionPageProps) {
  return (
    <Page>
      {header}
      <Main>
        <Content>
          <Logo src={gachiGachaLogo} alt="" aria-hidden="true" />
          <Eyebrow>COMING SOON</Eyebrow>
          <Title>{title}</Title>
          <Description>{description}</Description>
          <SearchLink href="/search">가챠 매장 찾아보기</SearchLink>
        </Content>
      </Main>
    </Page>
  );
}
