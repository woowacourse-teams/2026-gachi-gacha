export interface NotificationItem {
  notificationId: number;
  type: 'COMMENT';
  title: string;
  body: string;
  tradeId: number;
  commentId: number;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  notifications: NotificationItem[];
  nextLastNotificationId: number | null;
  hasNext: boolean;
}
