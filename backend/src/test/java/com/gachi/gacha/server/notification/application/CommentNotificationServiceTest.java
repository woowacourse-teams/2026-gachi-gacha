package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.comment.application.event.CommentCreatedEvent;
import com.gachi.gacha.server.member.application.MemberBlockService;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.notification.domain.Notification;
import com.gachi.gacha.server.notification.domain.NotificationJpaRepository;
import com.gachi.gacha.server.notification.domain.PushPlatform;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class CommentNotificationServiceTest {

    private static final Long COMMENT_ID = 100L;
    private static final String CONTENT = "교환 가능할까요?";

    @Autowired
    private CommentNotificationService commentNotificationService;

    @Autowired
    private MemberBlockService memberBlockService;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private NotificationJpaRepository notificationJpaRepository;

    @Autowired
    private PushTokenJpaRepository pushTokenJpaRepository;

    @MockitoBean
    private PushSender pushSender;

    private Member owner;
    private Member writer;
    private Trade trade;

    @BeforeEach
    void setUp() {
        owner = memberJpaRepository.save(Member.builder().nickname("owner").build());
        writer = memberJpaRepository.save(Member.builder().nickname("writer").build());
        trade = tradeJpaRepository.save(Trade.builder().member(owner).title("교환 게시글").build());
        pushTokenJpaRepository.save(PushToken.of(owner.getId(), "owner-token", PushPlatform.IOS));
        given(pushSender.send(anyList(), any())).willReturn(List.of());
    }

    @Test
    @DisplayName("다른 회원이 댓글을 달면 게시글 작성자에게 알림을 저장하고 같은 문구로 푸시를 보낸다")
    void notifyTradeOwner_memberComment() {
        // when
        commentNotificationService.notifyTradeOwner(event(writer.getId(), "writer"));

        // then
        List<Notification> notifications = notificationJpaRepository.findByReceiverIdOrderByIdDesc(
                owner.getId(),
                PageRequest.of(0, 10)
        );
        assertThat(notifications).hasSize(1);
        Notification notification = notifications.getFirst();
        assertThat(notification.getActorName()).isEqualTo("writer");

        ArgumentCaptor<PushMessage> messageCaptor = ArgumentCaptor.forClass(PushMessage.class);
        verify(pushSender).send(eq(List.of("owner-token")), messageCaptor.capture());
        PushMessage message = messageCaptor.getValue();
        assertThat(message.title()).isEqualTo("새 댓글이 달렸어요");
        assertThat(message.body()).isEqualTo("writer: " + CONTENT);
        assertThat(message.data())
                .containsEntry("type", "COMMENT")
                .containsEntry("notificationId", String.valueOf(notification.getId()))
                .containsEntry("tradeId", String.valueOf(trade.getId()))
                .containsEntry("commentId", String.valueOf(COMMENT_ID));
    }

    @Test
    @DisplayName("게시글 작성자 본인이 단 댓글이면 알리지 않는다")
    void notifyTradeOwner_ownComment() {
        // when
        commentNotificationService.notifyTradeOwner(event(owner.getId(), "owner"));

        // then
        assertThat(notificationJpaRepository.countByReceiverIdAndIsReadFalse(owner.getId())).isZero();
        verify(pushSender, never()).send(anyList(), any());
    }

    @Test
    @DisplayName("게시글 작성자가 차단한 회원의 댓글이면 알리지 않는다")
    void notifyTradeOwner_blockedWriter() {
        // given
        memberBlockService.block(owner.getId(), writer.getId());

        // when
        commentNotificationService.notifyTradeOwner(event(writer.getId(), "writer"));

        // then
        assertThat(notificationJpaRepository.countByReceiverIdAndIsReadFalse(owner.getId())).isZero();
        verify(pushSender, never()).send(anyList(), any());
    }

    @Test
    @DisplayName("비회원 댓글이면 표시 이름으로 알린다")
    void notifyTradeOwner_anonymousComment() {
        // when
        commentNotificationService.notifyTradeOwner(event(null, "루챠-118.44"));

        // then
        assertThat(notificationJpaRepository.countByReceiverIdAndIsReadFalse(owner.getId())).isEqualTo(1L);
        verify(pushSender).send(anyList(), any());
    }

    private CommentCreatedEvent event(final Long writerId, final String writerName) {
        return new CommentCreatedEvent(trade.getId(), COMMENT_ID, writerId, writerName, CONTENT);
    }
}
