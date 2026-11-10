import type { ReactNode } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import type { AnalyticsEventProperties } from '@/shared/analytics/analyticsEventType';
import { SUPPORT_INSTAGRAM_URL } from '@/shared/contact/supportContact';
import { color, focusRing, radius } from '@/shared/styles/tokens';

import { SERVICE_RELEASE_NOTES } from '../../updates/releaseNotes';

export type MyPageMenuKey = 'trades' | 'blocked-members';

interface MyPageMember {
  nickname: string | null;
  profileImageUrl: string | null;
}

export interface MyPageMenuProps {
  /** `side`: 웹 왼쪽 메뉴, `list`: 모바일 마이 탭 목록 */
  variant: 'side' | 'list';
  member: MyPageMember;
  activeKey?: MyPageMenuKey | undefined;
  showEventApplication?: boolean;
  onEditProfile: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

type MenuTarget = AnalyticsEventProperties<'account_menu_selected'>['target'];

type MenuItem =
  | {
      kind: 'route';
      label: string;
      to: string;
      key?: MyPageMenuKey;
      badge?: string;
      target: MenuTarget | 'event_application';
    }
  | { kind: 'external'; label: string; href: string; target: MenuTarget }
  | { kind: 'value'; label: string; value: string };

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const SERVICE_VERSION = SERVICE_RELEASE_NOTES[0]?.version ?? '';

function buildGroups(showEventApplication: boolean): MenuGroup[] {
  return [
    {
      label: '내 활동',
      items: [
        {
          kind: 'route',
          label: '내 글',
          to: '/mypage/trades',
          key: 'trades',
          target: 'my_trades',
        },
        ...(showEventApplication
          ? [
              {
                kind: 'route' as const,
                label: '이벤트 응모',
                to: '/events/popular-goods',
                badge: '기간 한정',
                target: 'event_application' as const,
              },
            ]
          : []),
      ],
    },
    {
      label: '사용자 관리',
      items: [
        {
          kind: 'route',
          label: '차단한 사용자',
          to: '/mypage/blocked-members',
          key: 'blocked-members',
          target: 'blocked_members',
        },
      ],
    },
    {
      label: '고객 지원',
      items: [
        {
          kind: 'external',
          label: '고객센터',
          href: SUPPORT_INSTAGRAM_URL,
          target: 'support',
        },
        {
          kind: 'external',
          label: '협업 문의',
          href: SUPPORT_INSTAGRAM_URL,
          target: 'collaboration',
        },
        {
          kind: 'route',
          label: '업데이트 소식',
          to: '/updates',
          target: 'updates',
        },
        {
          kind: 'route',
          label: '개인정보 처리방침',
          to: '/privacy',
          target: 'privacy',
        },
      ],
    },
    {
      label: '앱 정보',
      items: [{ kind: 'value', label: '앱 버전', value: SERVICE_VERSION }],
    },
  ];
}

function trackMenu(target: MenuTarget | 'event_application') {
  if (target === 'event_application') {
    captureAnalyticsEvent('event_application_started', { source: 'mypage' });
    return;
  }

  captureAnalyticsEvent('account_menu_selected', { target, source: 'mypage' });
}

export function MyPageMenu({
  variant,
  member,
  activeKey,
  showEventApplication = false,
  onEditProfile,
  onLogout,
  onDeleteAccount,
}: MyPageMenuProps) {
  const nickname = member.nickname?.trim() || '가치가챠 사용자';

  function renderItem(item: MenuItem): ReactNode {
    const isActive = item.kind === 'route' && item.key === activeKey;
    const chevron = variant === 'list' && <ChevronRightIcon />;

    if (item.kind === 'value') {
      return (
        <Item as="div" data-variant={variant}>
          <ItemLabel>{item.label}</ItemLabel>
          <ItemValue>{item.value}</ItemValue>
        </Item>
      );
    }

    if (item.kind === 'external') {
      return (
        <Item
          as="a"
          href={item.href}
          target="_blank"
          rel="noreferrer"
          data-variant={variant}
          onClick={() => trackMenu(item.target)}
        >
          <ItemLabel>{item.label}</ItemLabel>
          {chevron}
        </Item>
      );
    }

    return (
      <ItemLink
        to={item.to}
        data-variant={variant}
        data-active={isActive || undefined}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => trackMenu(item.target)}
      >
        <ItemLabel>
          {item.label}
          {item.badge && <ItemBadge>{item.badge}</ItemBadge>}
        </ItemLabel>
        {chevron}
      </ItemLink>
    );
  }

  return (
    <Root data-variant={variant} aria-label="마이 메뉴">
      <Profile data-variant={variant} data-private>
        <Avatar data-variant={variant}>
          {member.profileImageUrl ? (
            <img src={member.profileImageUrl} alt="" data-private-media />
          ) : (
            <UserIcon />
          )}
        </Avatar>
        <Nickname data-variant={variant} title={nickname}>
          {nickname}
        </Nickname>
        <EditProfileButton type="button" onClick={onEditProfile}>
          프로필 수정
        </EditProfileButton>
      </Profile>

      {buildGroups(showEventApplication).map((group) => (
        <Group key={group.label} data-variant={variant}>
          <GroupLabel data-variant={variant}>{group.label}</GroupLabel>
          <ItemList>
            {group.items.map((item) => (
              <li key={item.label}>{renderItem(item)}</li>
            ))}
          </ItemList>
        </Group>
      ))}

      <Group data-variant={variant} data-account>
        <GroupLabel data-variant={variant}>계정</GroupLabel>
        <ItemList>
          <li>
            <Item
              as="button"
              type="button"
              data-variant={variant}
              data-account
              onClick={onLogout}
            >
              <ItemLabel>로그아웃</ItemLabel>
            </Item>
          </li>
          <li>
            <Item
              as="button"
              type="button"
              data-variant={variant}
              data-account
              onClick={onDeleteAccount}
            >
              <ItemLabel>회원 탈퇴</ItemLabel>
            </Item>
          </li>
        </ItemList>
      </Group>
    </Root>
  );
}

const lineIconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" {...lineIconProps}>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <ChevronSvg width="20" height="20" viewBox="0 0 24 24" {...lineIconProps}>
      <path d="m9 18 6-6-6-6" />
    </ChevronSvg>
  );
}

const Root = styled.nav`
  display: flex;
  min-width: 0;
  flex-direction: column;

  &[data-variant='side'] {
    gap: 20px;
  }
`;

const Profile = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;

  &[data-variant='list'] {
    padding: 12px 24px 20px;
    gap: 14px;
  }
`;

const Avatar = styled.div`
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  overflow: hidden;
  place-items: center;
  border-radius: ${radius.circle};
  background: #f3f1ef;
  color: ${color.textMuted};

  svg {
    width: 22px;
    height: 22px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &[data-variant='list'] {
    width: 56px;
    height: 56px;

    svg {
      width: 26px;
      height: 26px;
    }
  }
`;

const Nickname = styled.p`
  min-width: 0;
  flex: 1;
  margin: 0;
  overflow: hidden;
  color: ${color.text};
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;

  &[data-variant='list'] {
    font-size: 18px;
  }
`;

const EditProfileButton = styled.button`
  height: 36px;
  flex: 0 0 auto;
  padding: 0 10px;
  border: 1px solid ${color.border};
  border-radius: 10px;
  background: ${color.surface};
  color: ${color.text};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: ${color.surfaceMuted};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }
`;

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: 2px;

  &[data-variant='list'] {
    gap: 0;
    padding: 12px 0 4px;
    border-top: 8px solid #f7f5f3;
  }

  &[data-variant='list'][data-account] {
    padding: 12px 0 8px;
  }
`;

const GroupLabel = styled.h2`
  margin: 0;
  color: ${color.textMuted};
  font-size: 12px;
  font-weight: 700;

  &[data-variant='list'] {
    padding: 0 24px 4px;
    font-size: 13px;
  }
`;

const ItemList = styled.ul`
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: 2px;
  list-style: none;

  [data-variant='list'] > & {
    gap: 0;
  }
`;

const Item = styled.a`
  display: flex;
  width: 100%;
  height: 40px;
  min-width: 0;
  padding: 0 12px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: ${color.text};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  box-sizing: border-box;
  cursor: pointer;

  &:is(a, button):hover {
    background: ${color.surfaceMuted};
  }

  &:focus-visible {
    box-shadow: ${focusRing};
    outline: none;
  }

  &[data-active] {
    background: #fff0f4;
    color: ${color.primary};
    font-weight: 700;
  }

  &[data-variant='list'] {
    height: 52px;
    padding: 0 24px;
    border-radius: 0;
    font-size: 15px;
    font-weight: 400;
  }

  &[data-variant='list'][data-account] {
    height: 44px;
    color: ${color.textMuted};
  }

  &[data-variant='list'][data-active] {
    background: transparent;
    color: ${color.text};
  }

  &:is(div) {
    cursor: default;
  }
`;

const ItemLink = Item.withComponent(Link);

const ItemLabel = styled.span`
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
`;

const ItemBadge = styled.span`
  padding: 2px 6px;
  border-radius: ${radius.pill};
  background: #fff0f4;
  color: #c51645;
  font-size: 11px;
  font-weight: 700;
`;

const ItemValue = styled.span`
  color: ${color.textMuted};
  font-size: 14px;
  font-weight: 400;
`;

const ChevronSvg = styled.svg`
  flex: 0 0 auto;
  color: ${color.textSubtle};
`;
