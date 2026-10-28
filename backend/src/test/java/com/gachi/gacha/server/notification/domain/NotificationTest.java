package com.gachi.gacha.server.notification.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NotificationTest {

    private static final Long RECEIVER_ID = 1L;
    private static final Long TRADE_ID = 2L;
    private static final Long COMMENT_ID = 3L;

    @Test
    @DisplayName("댓글 알림은 읽지 않은 상태로 만들어진다")
    void ofComment_unread() {
        // when
        Notification notification = Notification.ofComment(RECEIVER_ID, TRADE_ID, COMMENT_ID, "가챠친구", "교환 가능할까요?");

        // then
        assertThat(notification.getType()).isEqualTo(NotificationType.COMMENT);
        assertThat(notification.getPreview()).isEqualTo("교환 가능할까요?");
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    @DisplayName("댓글 내용이 100자를 넘으면 미리보기는 앞 100자만 남긴다")
    void ofComment_truncatesPreview() {
        // given
        String content = "가".repeat(150);

        // when
        Notification notification = Notification.ofComment(RECEIVER_ID, TRADE_ID, COMMENT_ID, "가챠친구", content);

        // then
        assertThat(notification.getPreview()).isEqualTo("가".repeat(100));
    }

    @Test
    @DisplayName("읽음 처리하면 읽은 상태가 된다")
    void read() {
        // given
        Notification notification = Notification.ofComment(RECEIVER_ID, TRADE_ID, COMMENT_ID, "가챠친구", "교환 가능할까요?");

        // when
        notification.read();

        // then
        assertThat(notification.isRead()).isTrue();
    }
}
