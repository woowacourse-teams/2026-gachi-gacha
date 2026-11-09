import styled from '@emotion/styled';

import { breakpoint, color, radius } from '@/shared/styles/tokens';

const mobile = `@media (max-width: ${breakpoint.mobile})`;

export const Hero = styled.header`
  display: flex;
  flex-direction: column;
  gap: 10px;

  ${mobile} {
    gap: 8px;
  }
`;

export const Eyebrow = styled.span`
  color: ${color.primary};
  font-size: 15px;
  font-weight: 700;

  ${mobile} {
    font-size: 13px;
  }
`;

export const Title = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: 36px;
  font-weight: 700;
  line-height: 1.3;

  ${mobile} {
    font-size: 24px;
  }
`;

export const Intro = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: 16px;
  line-height: 1.6;
  word-break: keep-all;

  ${mobile} {
    font-size: 14px;
    line-height: 1.55;
  }
`;

export const ReleaseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;

  ${mobile} {
    gap: 24px;
  }
`;

export const ReleaseCard = styled.article`
  display: flex;
  padding-top: 32px;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  border-top: 1px solid ${color.border};

  ${mobile} {
    padding-top: 24px;
    gap: 10px;
  }
`;

export const ReleaseMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${color.textSubtle};
  font-size: 14px;

  ${mobile} {
    gap: 8px;
    font-size: 13px;
  }
`;

export const Version = styled.strong`
  color: ${color.primary};
  font-size: 16px;
  font-weight: 700;

  ${mobile} {
    font-size: 15px;
  }
`;

export const LatestBadge = styled.span`
  display: inline-flex;
  height: 26px;
  padding: 0 10px;
  align-items: center;
  border-radius: ${radius.pill};
  background: #fff0f4;
  color: ${color.primary};
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;

  &[data-placement='below-title'] {
    display: none;
  }

  ${mobile} {
    &[data-placement='meta'] {
      display: none;
    }

    &[data-placement='below-title'] {
      display: inline-flex;
    }
  }
`;

export const ReleaseTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
  word-break: keep-all;

  ${mobile} {
    font-size: 18px;
  }
`;

export const ReleaseSummary = styled.p`
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

export const HighlightList = styled.ul`
  display: flex;
  margin: 0;
  padding: 4px 0;
  flex-direction: column;
  gap: 6px;
  list-style: none;

  li {
    position: relative;
    padding-left: 16px;
    color: ${color.text};
    font-size: 15px;
    line-height: 1.6;
    word-break: keep-all;
  }

  li::before {
    position: absolute;
    top: 0.75em;
    left: 2px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${color.primary};
    content: '';
    transform: translateY(-50%);
  }

  ${mobile} {
    li {
      padding-left: 14px;
      font-size: 14px;
      line-height: 1.55;
    }
  }
`;

export const ReleaseSourceLink = styled.a`
  color: ${color.primary};
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;
