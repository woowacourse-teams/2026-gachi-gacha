import type { ReactNode } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import { AppHeader } from '@/shared/ui/AppHeader';

interface TradeFormLayoutProps {
  title: string;
  backTo: string;
  backLabel: string;
  children: ReactNode;
}

export default function TradeFormLayout({
  title,
  backTo,
  backLabel,
  children,
}: TradeFormLayoutProps) {
  return (
    <Page>
      <DesktopHeader>
        <AppHeader currentPath="/trade" />
      </DesktopHeader>

      <Main>
        <Heading>
          <MobileBack to={backTo} aria-label={backLabel}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="m14 5-7 7 7 7" />
            </svg>
          </MobileBack>
          <Title>{title}</Title>
        </Heading>

        {children}
      </Main>
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  box-sizing: border-box;
  min-height: 100dvh;
  padding-bottom: calc(81px + env(safe-area-inset-bottom));
  flex-direction: column;
  background: #ffffff;
`;

const Main = styled.main`
  box-sizing: border-box;
  width: min(100%, 768px);
  margin: 0 auto;
  padding: 40px 24px;
  flex: 1;

  @media (max-width: 767px) {
    padding: 0 24px 28px;
  }
`;

const Heading = styled.div`
  margin-bottom: 32px;

  @media (max-width: 767px) {
    display: flex;
    min-height: 48px;
    margin: 0 -16px 8px;
    align-items: center;
  }
`;

const Title = styled.h1`
  margin: 0;
  color: #202126;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.04em;

  @media (max-width: 767px) {
    font-size: 20px;
  }
`;

const DesktopHeader = styled.div`
  display: contents;

  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileBack = styled(Link)`
  display: none;

  @media (max-width: 767px) {
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    color: inherit;
  }
`;
