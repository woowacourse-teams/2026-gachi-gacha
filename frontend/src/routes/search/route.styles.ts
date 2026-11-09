import styled from '@emotion/styled';
import { Link } from 'react-router';

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

    header {
      border: 0;
      background: transparent;
    }

    header > div:has(> [data-header-search-slot]) {
      display: block;
      padding: 0;
    }

    header > div > :not([data-header-search-slot]) {
      display: none;
    }

    &&
      header[data-mobile-tabs]:not([data-mobile-search-open])
      [data-header-search-slot] {
      display: block;
      pointer-events: auto;
    }

    nav[aria-label='하단 메뉴'] {
      pointer-events: auto;
    }
  }
`;

export const MapSearchLink = styled(Link)`
  display: flex;
  min-height: 44px;
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #e7e4e2;
  border-radius: 999px;
  background: #fff;
  color: #777173;
  font-size: 14px;
  text-decoration: none;
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
