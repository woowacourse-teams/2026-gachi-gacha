import styled from '@emotion/styled';

import { breakpoint, color, focusRing, radius } from '@/shared/styles/tokens';

const mobile = `@media (max-width: ${breakpoint.mobile})`;

export const TitleBlock = styled.header`
  display: flex;
  flex-direction: column;
  gap: 10px;

  ${mobile} {
    gap: 8px;
  }
`;

export const Title = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: 36px;
  font-weight: 700;
  line-height: 1.3;
  word-break: keep-all;

  ${mobile} {
    font-size: 22px;
    line-height: 1.35;
  }
`;

export const Introduction = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: 15px;
  line-height: 1.6;
  word-break: keep-all;

  ${mobile} {
    font-size: 14px;
    line-height: 1.55;
  }
`;

export const EffectiveDate = styled.p`
  margin: 0;
  color: ${color.textSubtle};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;

  ${mobile} {
    font-size: 13px;
  }
`;

export const DraftNotice = styled.aside`
  padding: 16px;
  border-radius: ${radius.control};
  background: #fff0f4;
  color: ${color.primary};
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
  word-break: keep-all;
`;

export const Section = styled.section`
  display: flex;
  min-width: 0;
  padding-top: 28px;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid ${color.border};
  color: ${color.textMuted};
  font-size: 15px;
  line-height: 1.6;
  word-break: keep-all;

  p {
    margin: 0;
  }

  ul,
  ol {
    display: flex;
    margin: 0;
    padding-left: 20px;
    flex-direction: column;
    gap: 6px;
  }

  li::marker {
    color: ${color.primary};
  }

  ${mobile} {
    padding-top: 24px;
    gap: 10px;
    font-size: 14px;
    line-height: 1.55;
  }
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;

  ${mobile} {
    font-size: 17px;
  }
`;

export const SubsectionTitle = styled.h3`
  margin: 8px 0 0;
  color: ${color.text};
  font-size: 17px;
  font-weight: 700;

  ${mobile} {
    font-size: 15px;
  }
`;

export const TableScroll = styled.div`
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${color.border};
  border-radius: 10px;

  ${mobile} {
    overflow: visible;
    border: 0;
    border-radius: 0;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.6;

  th,
  td {
    padding: 12px 16px;
    border-bottom: 1px solid ${color.border};
    text-align: left;
    vertical-align: top;
  }

  tr:last-of-type th,
  tr:last-of-type td {
    border-bottom: 0;
  }

  thead tr:last-of-type th {
    border-bottom: 1px solid ${color.border};
  }

  thead th {
    background: #f7f5f3;
    color: ${color.text};
    font-weight: 700;
    white-space: nowrap;
  }

  tbody th {
    width: 22%;
    color: ${color.text};
    font-weight: 700;
  }

  td {
    color: ${color.textMuted};
  }

  ${mobile} {
    display: block;

    thead {
      display: none;
    }

    tbody {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    tr {
      display: flex;
      padding: 14px;
      flex-direction: column;
      gap: 6px;
      border-radius: 12px;
      background: #f7f5f3;
    }

    th,
    td,
    tbody th,
    tr:last-of-type th,
    tr:last-of-type td {
      width: auto;
      padding: 0;
      border: 0;
    }

    td[data-label]::before {
      display: block;
      margin-bottom: 2px;
      color: ${color.textSubtle};
      font-size: 12px;
      font-weight: 500;
      content: attr(data-label);
    }
  }
`;

export const ExternalLink = styled.a`
  color: ${color.primary};
  font-weight: 700;
  text-underline-offset: 3px;

  &:focus-visible {
    border-radius: 3px;
    box-shadow: ${focusRing};
    outline: none;
  }
`;
