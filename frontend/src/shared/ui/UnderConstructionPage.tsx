import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';

import {
  Content,
  Description,
  Eyebrow,
  Logo,
  Page,
  SearchLink,
  Title,
} from './UnderConstructionPage.styles';

export interface UnderConstructionPageProps {
  title: string;
  description: string;
}

export function UnderConstructionPage({
  title,
  description,
}: UnderConstructionPageProps) {
  return (
    <Page>
      <Content>
        <Logo src={gachiGachaLogo} alt="" aria-hidden="true" />
        <Eyebrow>COMING SOON</Eyebrow>
        <Title>{title}</Title>
        <Description>{description}</Description>
        <SearchLink href="/search">가챠 매장 찾아보기</SearchLink>
      </Content>
    </Page>
  );
}
