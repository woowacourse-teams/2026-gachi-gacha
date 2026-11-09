import type { ReactNode } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import { color, focusRing } from '@/shared/styles/tokens';

export type ErrorStateIcon = 'alert' | 'question' | 'lock' | 'wifi-off';

type ErrorStateAction =
  | { label: string; to: string; onClick?: () => void }
  | { label: string; onClick: () => void; to?: undefined };

export interface ErrorStateProps {
  icon?: ErrorStateIcon;
  title: string;
  description: ReactNode;
  action?: ErrorStateAction | undefined;
  /** 화면 제목이면 h1, 영역 안의 안내면 h2 */
  headingLevel?: 1 | 2;
  /** 오류를 바로 알려야 할 때 alert 역할을 준다 */
  announce?: boolean;
}

const ICON_PATHS: Record<ErrorStateIcon, ReactNode> = {
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  ),
  lock: (
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  'wifi-off': (
    <>
      <path d="M12 20h.01" />
      <path d="M8.5 16.43a5 5 0 0 1 7 0" />
      <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
      <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
      <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
      <path d="M5 13a10 10 0 0 1 5.24-2.76" />
      <path d="m2 2 20 20" />
    </>
  ),
};

/** Pen `App/Error State`: 화면이나 영역을 채울 내용을 불러오지 못했을 때 쓰는 안내 */
export function ErrorState({
  icon = 'alert',
  title,
  description,
  action,
  headingLevel = 2,
  announce = false,
}: ErrorStateProps) {
  const Heading = headingLevel === 1 ? Title1 : Title2;

  return (
    <Root role={announce ? 'alert' : undefined}>
      <IconWrap aria-hidden="true">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICON_PATHS[icon]}
        </svg>
      </IconWrap>
      <Heading>{title}</Heading>
      <Description>{description}</Description>
      {action &&
        (action.to !== undefined ? (
          <ActionLink to={action.to} onClick={action.onClick}>
            {action.label}
          </ActionLink>
        ) : (
          <ActionButton type="button" onClick={action.onClick}>
            {action.label}
          </ActionButton>
        ))}
    </Root>
  );
}

const Root = styled.div`
  display: flex;
  width: 100%;
  padding: 0 32px;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  text-align: center;
`;

const IconWrap = styled.span`
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 50%;
  background: #fff0f4;
  color: #c51645;
`;

const titleStyles = `
  margin: 0;
  color: ${color.text};
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  word-break: keep-all;
`;

const Title1 = styled.h1`
  ${titleStyles}
`;

const Title2 = styled.h2`
  ${titleStyles}
`;

const Description = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: 14px;
  line-height: 1.45;
  word-break: keep-all;
`;

const actionStyles = `
  display: inline-flex;
  width: 160px;
  height: 48px;
  margin-top: 8px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.border};
  border-radius: 14px;
  background: ${color.surface};
  color: ${color.text};
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: ${color.surfaceMuted};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const ActionButton = styled.button`
  ${actionStyles}
`;

const ActionLink = styled(Link)`
  ${actionStyles}
`;
