package com.gachi.gacha.server.notification.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class NotificationJpaRepositoryTest {

    private static final Long TRADE_ID = 10L;
    private static final Long COMMENT_ID = 20L;

    @Autowired
    private NotificationJpaRepository notificationJpaRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    private Member receiver;

    @BeforeEach
    void setUp() {
        receiver = memberJpaRepository.save(Member.builder().nickname("receiver").build());
    }

    @Test
    @DisplayName("댓글 알림을 저장하면 생성 시각과 함께 읽지 않은 상태로 저장된다")
    void save() {
        // when
        Notification saved = notificationJpaRepository.saveAndFlush(
                Notification.ofComment(receiver.getId(), TRADE_ID, COMMENT_ID, "가챠친구", "교환 가능할까요?")
        );

        // then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.isRead()).isFalse();
    }

    @Test
    @DisplayName("같은 댓글로 같은 회원에게 알림을 두 번 저장할 수 없다")
    void duplicateCommentNotification() {
        // given
        notificationJpaRepository.saveAndFlush(
                Notification.ofComment(receiver.getId(), TRADE_ID, COMMENT_ID, "가챠친구", "교환 가능할까요?")
        );

        // when & then
        assertThatThrownBy(() -> notificationJpaRepository.saveAndFlush(
                Notification.ofComment(receiver.getId(), TRADE_ID, COMMENT_ID, "가챠친구", "교환 가능할까요?")
        )).isInstanceOf(DataIntegrityViolationException.class);
    }
}
