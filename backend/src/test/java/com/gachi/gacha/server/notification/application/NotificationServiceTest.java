package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.common.exception.InvalidPageRequestException;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.notification.application.dto.NotificationInfo;
import com.gachi.gacha.server.notification.application.dto.NotificationPageInfo;
import com.gachi.gacha.server.notification.domain.Notification;
import com.gachi.gacha.server.notification.domain.NotificationJpaRepository;
import com.gachi.gacha.server.notification.domain.exception.NotificationNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class NotificationServiceTest {

    private static final Long TRADE_ID = 10L;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationJpaRepository notificationJpaRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    private Member receiver;
    private Member other;

    @BeforeEach
    void setUp() {
        receiver = memberJpaRepository.save(Member.builder().nickname("receiver").build());
        other = memberJpaRepository.save(Member.builder().nickname("other").build());
    }

    @Nested
    @DisplayName("알림 목록 조회")
    class GetNotifications {

        @Test
        @DisplayName("내 알림만 최신순으로 페이지 크기만큼 반환하고 다음 페이지 정보를 함께 준다")
        void getNotifications_firstPage() {
            // given
            saveNotification(receiver, 1L);
            Notification second = saveNotification(receiver, 2L);
            Notification third = saveNotification(receiver, 3L);
            saveNotification(other, 4L);

            // when
            NotificationPageInfo page = notificationService.getNotifications(receiver.getId(), null, 2);

            // then
            assertThat(page.notifications())
                    .extracting(NotificationInfo::notificationId)
                    .containsExactly(third.getId(), second.getId());
            assertThat(page.hasNext()).isTrue();
            assertThat(page.nextLastNotificationId()).isEqualTo(second.getId());
        }

        @Test
        @DisplayName("마지막 알림 ID를 넘기면 그보다 이전 알림을 반환한다")
        void getNotifications_nextPage() {
            // given
            Notification first = saveNotification(receiver, 1L);
            Notification second = saveNotification(receiver, 2L);
            saveNotification(receiver, 3L);

            // when
            NotificationPageInfo page = notificationService.getNotifications(receiver.getId(), second.getId(), 2);

            // then
            assertThat(page.notifications())
                    .extracting(NotificationInfo::notificationId)
                    .containsExactly(first.getId());
            assertThat(page.hasNext()).isFalse();
        }

        @Test
        @DisplayName("문구는 작성자 이름과 댓글 미리보기로 만들어 반환한다")
        void getNotifications_message() {
            // given
            saveNotification(receiver, 1L);

            // when
            NotificationInfo info = notificationService.getNotifications(receiver.getId(), null, 20)
                    .notifications()
                    .getFirst();

            // then
            assertThat(info.title()).isEqualTo("새 댓글이 달렸어요");
            assertThat(info.body()).isEqualTo("가챠친구: 교환 가능할까요?");
            assertThat(info.read()).isFalse();
        }

        @Test
        @DisplayName("페이지 크기가 범위를 벗어나면 예외가 발생한다")
        void getNotifications_invalidPageSize() {
            // when & then
            assertThatThrownBy(() -> notificationService.getNotifications(receiver.getId(), null, 101))
                    .isInstanceOf(InvalidPageRequestException.class);
        }
    }

    @Nested
    @DisplayName("읽음 처리")
    class Read {

        @Test
        @DisplayName("내 알림을 읽음 처리하면 안 읽은 수가 줄어든다")
        void read_ownNotification() {
            // given
            Notification notification = saveNotification(receiver, 1L);
            saveNotification(receiver, 2L);

            // when
            notificationService.read(receiver.getId(), notification.getId());

            // then
            assertThat(notificationService.getUnreadCount(receiver.getId())).isEqualTo(1L);
        }

        @Test
        @DisplayName("다른 회원의 알림을 읽음 처리하면 예외가 발생한다")
        void read_othersNotification() {
            // given
            Notification notification = saveNotification(other, 1L);

            // when & then
            assertThatThrownBy(() -> notificationService.read(receiver.getId(), notification.getId()))
                    .isInstanceOf(NotificationNotFoundException.class);
        }

        @Test
        @DisplayName("모두 읽음 처리하면 내 알림만 읽음 상태가 된다")
        void readAll() {
            // given
            saveNotification(receiver, 1L);
            saveNotification(receiver, 2L);
            saveNotification(other, 3L);

            // when
            notificationService.readAll(receiver.getId());

            // then
            assertThat(notificationService.getUnreadCount(receiver.getId())).isZero();
            assertThat(notificationService.getUnreadCount(other.getId())).isEqualTo(1L);
        }
    }

    private Notification saveNotification(final Member notificationReceiver, final Long commentId) {
        return notificationJpaRepository.save(
                Notification.ofComment(notificationReceiver.getId(), TRADE_ID, commentId, "가챠친구", "교환 가능할까요?")
        );
    }
}
