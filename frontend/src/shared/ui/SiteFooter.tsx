import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import logoIcon from '@/assets/gacha_logo.png';
import logoWordmark from '@/assets/gachigacha.png';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { SUPPORT_INSTAGRAM_URL } from '@/shared/contact/supportContact';
import { color } from '@/shared/styles/tokens';

const FOOTERLESS_ROUTE_ROOTS = ['/map', '/chat', '/oauth'] as const;

export const SITE_FOOTER_ID = 'site-footer';

function isPathOrNestedRoute(pathname: string, routeRoot: string) {
  return pathname === routeRoot || pathname.startsWith(`${routeRoot}/`);
}

/** 전체 화면 상호작용·전환 경로를 제외한 일반 콘텐츠 페이지에 푸터를 표시한다. */
export function shouldShowSiteFooter(pathname: string) {
  if (pathname === '/') {
    return false;
  }

  return !FOOTERLESS_ROUTE_ROOTS.some((routeRoot) =>
    isPathOrNestedRoute(pathname, routeRoot),
  );
}

export function SiteFooter() {
  return (
    <Wrapper id={SITE_FOOTER_ID}>
      <BrandGroup>
        <Brand aria-label="GachiGacha">
          <BrandIcon src={logoIcon} alt="" aria-hidden="true" />
          <BrandWordmark src={logoWordmark} alt="GachiGacha" />
        </Brand>
        <Copyright>© 2026 GachiGacha. 전국의 가챠를 한 곳에서.</Copyright>
      </BrandGroup>

      <Navigation aria-label="푸터 메뉴">
        <InternalLink to="/privacy">개인정보 처리방침</InternalLink>
        <ExternalLink
          href={SUPPORT_INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            captureAnalyticsEvent('footer_contact_selected', {
              target: 'partnership',
            });
          }}
        >
          협업 문의
        </ExternalLink>
        <ExternalLink
          href={SUPPORT_INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            captureAnalyticsEvent('footer_contact_selected', {
              target: 'support',
            });
          }}
        >
          고객센터
        </ExternalLink>
      </Navigation>
    </Wrapper>
  );
}

const Wrapper = styled.footer`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-height: 88px;
  padding: 16px 40px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-top: 1px solid ${color.borderSubtle};
  background: ${color.surfaceMuted};

  @media (max-width: 720px) {
    padding: 20px 24px;
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
  }
`;

const BrandGroup = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BrandIcon = styled.img`
  height: 14px;
`;

const BrandWordmark = styled.img`
  height: 13px;
`;

const Copyright = styled.p`
  margin: 0;
  color: ${color.textSubtle};
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

const navigationLinkStyles = css`
  color: ${color.textMuted};
  font-size: 13px;
  font-weight: 400;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: ${color.text};
    text-decoration: underline;
  }

  &:focus-visible {
    border-radius: 4px;
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 3px;
  }
`;

const InternalLink = styled(Link)`
  ${navigationLinkStyles};
`;

const ExternalLink = styled.a`
  ${navigationLinkStyles};
`;
