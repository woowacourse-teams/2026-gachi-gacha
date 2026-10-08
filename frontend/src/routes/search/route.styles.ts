import styled from '@emotion/styled';

export const Page = styled.main`
  display: flex;
  height: 100dvh;
  min-height: 100dvh;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #242122);

  @media (max-width: 767px) {
    display: block;
    height: auto;
    overflow: visible;
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
  padding: 18px 20px;
  margin-top: 20px;
  border: 1px solid var(--color-primary-soft, #fff1f3);
  border-radius: 16px;
  background: linear-gradient(135deg, #fff7f8 0%, #ffffff 100%);
  box-shadow: 0 8px 24px rgb(64 40 46 / 6%);

  @media (max-width: 767px) {
    padding: 12px 14px;
    margin-top: 0;
    border-color: rgb(217 59 84 / 18%);
    background: rgb(255 255 255 / 94%);
    backdrop-filter: blur(10px);
  }
`;

export const ServiceAreaEyebrow = styled.p`
  margin: 0 0 5px;
  color: var(--color-primary, #d93b54);
  font-size: 12px;
  font-weight: 800;
`;

export const ServiceAreaTitle = styled.strong`
  display: block;
  color: var(--color-text, #242122);
  font-size: 17px;
  line-height: 1.35;

  @media (max-width: 767px) {
    font-size: 15px;
  }
`;

export const ServiceAreaDescription = styled.p`
  margin: 5px 0 0;
  color: var(--color-text-muted, #696466);
  font-size: 13px;
  line-height: 1.5;

  @media (max-width: 767px) {
    font-size: 12px;
  }
`;
