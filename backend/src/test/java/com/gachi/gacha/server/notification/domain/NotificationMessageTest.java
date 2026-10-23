package com.gachi.gacha.server.notification.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NotificationMessageTest {

    @Test
    @DisplayName("댓글 알림은 작성자 이름과 댓글 미리보기로 문구를 만든다")
    void from_comment() {
        // given
        Notification notification = Notification.ofComment(1L, 2L, 3L, "가챠친구", "교환 가능할까요?");

        // when
        NotificationMessage message = NotificationMessage.from(notification);

        // then
        assertThat(message.title()).isEqualTo("새 댓글이 달렸어요");
        assertThat(message.body()).isEqualTo("가챠친구: 교환 가능할까요?");
    }
}
