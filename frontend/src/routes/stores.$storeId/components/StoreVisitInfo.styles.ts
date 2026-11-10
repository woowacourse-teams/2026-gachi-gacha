import styled from '@emotion/styled';

import { color, focusRing } from '@/shared/styles/tokens';

export const Section = styled.section`
  grid-area: visit;
  min-width: 0;
  padding-top: 20px;
  margin-top: 24px;
  border-top: 1px solid ${color.border};
  @media (max-width: 767px) {
    margin-top: 0;
    padding: 20px 24px;
    border-top: 8px solid #f7f5f3;
  }
`;
export const SectionTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
`;
export const InfoList = styled.dl`
  display: grid;
  margin: 12px 0 0;
  gap: 10px;
`;
export const InfoContent = styled.div`
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
`;
export const InfoLabel = styled.dt`
  flex: 0 0 auto;
  color: ${color.textMuted};
  font-size: 14px;
  line-height: 1.4;
`;
export const InfoValue = styled.dd`
  min-width: 0;
  margin: 0;
  color: ${color.text};
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
  text-align: right;
  white-space: pre-line;
`;
export const InfoLink = styled.a`
  color: inherit;
  text-underline-offset: 3px;
  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;
export const Updated = styled.p`
  grid-area: updated;
  margin: 24px 0 0;
  color: ${color.textMuted};
  font-size: 12px;
  line-height: 1.4;
  @media (max-width: 767px) {
    margin: 0;
    padding: 0 24px 20px;
  }
`;
