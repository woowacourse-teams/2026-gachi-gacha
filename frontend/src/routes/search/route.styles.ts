import styled from '@emotion/styled';

export const Page = styled.main`
  position: relative;
  display: flex;
  height: 100dvh;
  min-height: 100dvh;
  flex-direction: column;
  overflow: hidden;
  --mobile-map-header-offset: 60px;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #242122);

  @media (max-width: 767px) {
    display: block;
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
    overscroll-behavior: none;
  }
`;

export const MobileHeaderLayer = styled.div`
  position: relative;
  z-index: 40;
  flex: 0 0 auto;

  @media (max-width: 767px) {
    position: absolute;
    inset: 0 0 auto;
    padding: max(8px, env(safe-area-inset-top)) 12px 0;
    pointer-events: none;

    nav[aria-label='하단 메뉴'] {
      pointer-events: auto;
    }
  }
`;

export const PageTitle = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const SelectedGachaArea = styled.div`
  padding-top: 24px;

  @media (max-width: 767px) {
    padding-top: 0;
  }
`;

export const ServiceAreaNotice = styled.aside`
  margin: 0;
  padding: 16px 0;

  @media (max-width: 767px) {
    padding: 8px 0;
  }
`;

export const ServiceAreaTitle = styled.strong`
  display: block;
  color: #242122;
  font-size: 16px;

  @media (max-width: 767px) {
    font-size: 12px;
  }
`;
