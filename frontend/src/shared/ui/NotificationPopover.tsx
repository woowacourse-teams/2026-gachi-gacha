import type { AsyncState } from '@/shared/hooks/asyncStateType';

import {
  CloseButton,
  EmptyDescription,
  EmptyIcon,
  EmptyState,
  ErrorMessage,
  Header,
  ItemContent,
  ItemLink,
  ItemMessage,
  ItemMeta,
  ItemTitle,
  List,
  LoadingItem,
  Popover,
  RetryButton,
  Title,
  UnreadDot,
} from './NotificationPopover.styles';

export type HeaderNotificationType = 'chat' | 'trade' | 'gacha';

export interface HeaderNotification {
  id: string;
  type: HeaderNotificationType;
  title: string;
  message: string;
  createdAtLabel: string;
  isRead: boolean;
  destination: string;
}

export type HeaderNotificationState = AsyncState<readonly HeaderNotification[]>;

export interface NotificationPopoverProps {
  id: string;
  titleId: string;
  notificationState: HeaderNotificationState;
  onClose: () => void;
  onNotificationSelect?:
    ((notification: HeaderNotification) => void) | undefined;
  onRetry?: (() => void) | undefined;
}

const NOTIFICATION_TYPE_LABELS: Record<HeaderNotificationType, string> = {
  chat: '채팅',
  trade: '교환',
  gacha: '가챠',
};

function NotificationItems({
  notifications,
  onClose,
  onNotificationSelect,
}: {
  notifications: readonly HeaderNotification[];
  onClose: () => void;
  onNotificationSelect?:
    ((notification: HeaderNotification) => void) | undefined;
}) {
  return (
    <List aria-label="최근 알림">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <ItemLink
            to={notification.destination}
            $isRead={notification.isRead}
            onClick={() => {
              onNotificationSelect?.(notification);
              onClose();
            }}
          >
            <ItemContent>
              <ItemMeta>
                <span>{NOTIFICATION_TYPE_LABELS[notification.type]}</span>
                <time>{notification.createdAtLabel}</time>
              </ItemMeta>
              <ItemTitle>
                {!notification.isRead && <UnreadDot aria-hidden="true" />}
                {notification.title}
              </ItemTitle>
              <ItemMessage>{notification.message}</ItemMessage>
            </ItemContent>
          </ItemLink>
        </li>
      ))}
    </List>
  );
}

export function NotificationPopover({
  id,
  titleId,
  notificationState,
  onClose,
  onNotificationSelect,
  onRetry,
}: NotificationPopoverProps) {
  return (
    <Popover id={id} role="dialog" aria-labelledby={titleId} aria-live="polite">
      <Header>
        <Title id={titleId}>알림</Title>
        <CloseButton type="button" onClick={onClose} aria-label="알림 닫기">
          ×
        </CloseButton>
      </Header>

      {notificationState.status === 'loading' && (
        <List aria-label="알림을 불러오는 중" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <LoadingItem aria-hidden="true" />
            </li>
          ))}
        </List>
      )}

      {notificationState.status === 'error' && (
        <EmptyState>
          <EmptyIcon aria-hidden="true">!</EmptyIcon>
          <ErrorMessage>{notificationState.errorMessage}</ErrorMessage>
          {onRetry && (
            <RetryButton type="button" onClick={onRetry}>
              다시 시도
            </RetryButton>
          )}
        </EmptyState>
      )}

      {(notificationState.status === 'idle' ||
        (notificationState.status === 'success' &&
          notificationState.data.length === 0)) && (
        <EmptyState>
          <EmptyIcon aria-hidden="true">✓</EmptyIcon>
          <strong>새로운 알림이 없어요</strong>
          <EmptyDescription>
            교환과 채팅 소식이 생기면 바로 알려드릴게요.
          </EmptyDescription>
        </EmptyState>
      )}

      {notificationState.status === 'success' &&
        notificationState.data.length > 0 && (
          <NotificationItems
            notifications={notificationState.data}
            onClose={onClose}
            onNotificationSelect={onNotificationSelect}
          />
        )}
    </Popover>
  );
}
