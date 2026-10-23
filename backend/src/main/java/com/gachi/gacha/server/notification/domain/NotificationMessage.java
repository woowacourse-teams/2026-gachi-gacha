package com.gachi.gacha.server.notification.domain;

/**
 * 알림에 보여 줄 문구. 알림 목록과 푸시가 같은 문구를 쓰도록 문장 조립을 이곳 한곳에 둔다.
 */
public record NotificationMessage(
        String title,
        String body
) {

    private static final String COMMENT_TITLE = "새 댓글이 달렸어요";
    private static final String COMMENT_BODY_FORMAT = "%s: %s";

    public static NotificationMessage from(final Notification notification) {
        return switch (notification.getType()) {
            case COMMENT -> new NotificationMessage(
                    COMMENT_TITLE,
                    COMMENT_BODY_FORMAT.formatted(notification.getActorName(), notification.getPreview())
            );
        };
    }
}
