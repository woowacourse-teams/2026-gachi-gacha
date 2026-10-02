import styled from '@emotion/styled';

import { SUPPORT_INSTAGRAM_URL } from '@/shared/contact/supportContact';

import Logo from '../Logo';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const FOOTER_LINKS: readonly FooterLink[] = [
  { label: '이용약관', href: '/terms' },
  { label: '개인정보 처리방침', href: '/privacy' },
  { label: '매장 입점 문의', href: SUPPORT_INSTAGRAM_URL, external: true },
  { label: '고객센터', href: SUPPORT_INSTAGRAM_URL, external: true },
];

export default function Footer() {
  return (
    <Wrapper>
      <BrandGroup>
        <Logo compact />
        <Copyright>© 2026 GachiGacha, Inc. 전국의 가챠를 한 곳에서.</Copyright>
      </BrandGroup>

      <Navigation aria-label="푸터 메뉴">
        {FOOTER_LINKS.map((link) => (
          <NavigationLink
            key={link.label}
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noreferrer' : undefined}
          >
            {link.label}
          </NavigationLink>
        ))}
      </Navigation>
    </Wrapper>
  );
}

const Wrapper = styled.footer`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 88px;
  padding: 16px 40px;
  background: #fafafa;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
    padding: 20px 24px;
  }
`;

const BrandGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
`;

const Copyright = styled.p`
  margin: 0;
  color: #9a9095;
  font-size: 12px;
  font-weight: 400;
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;

  @media (max-width: 720px) {
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 12px 24px;
  }
`;

const NavigationLink = styled.a`
  color: #6f6469;
  font-size: 13px;
  font-weight: 400;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: #2b2528;
    text-decoration: underline;
  }
`;
