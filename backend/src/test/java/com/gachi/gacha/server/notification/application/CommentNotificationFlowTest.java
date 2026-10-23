package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.comment.application.CommentService;
import com.gachi.gacha.server.comment.application.dto.CommentCreateCommand;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.notification.domain.NotificationJpaRepository;
import com.gachi.gacha.server.notification.domain.PushPlatform;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 댓글 작성 커밋 이후 비동기로 알림이 저장되고 푸시가 나가는 전체 흐름을 검증한다.
 *
 * <p>트랜잭션을 건 테스트는 커밋하지 않아 AFTER_COMMIT 리스너가 실행되지 않는다. 그래서 테스트 자체에는
 * 트랜잭션을 걸지 않고, 데이터는 직접 만들고 지운다.
 */
@SpringBootTest
class CommentNotificationFlowTest {

    private static final long TIMEOUT_MILLIS = 5_000;
    private static final String MASKED_IP = "118.44";

    @Autowired
    private CommentService commentService;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private NotificationJpaRepository notificationJpaRepository;

    @Autowired
    private PushTokenJpaRepository pushTokenJpaRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    @MockitoBean
    private PushSender pushSender;

    private final String token = "owner-token-" + UUID.randomUUID();

    private Long ownerId;
    private Long writerId;
    private Long tradeId;

    @BeforeEach
    void setUp() {
        Member owner = memberJpaRepository.save(createMember("owner"));
        Member writer = memberJpaRepository.save(createMember("writer"));
        ownerId = owner.getId();
        writerId = writer.getId();
        tradeId = tradeJpaRepository.save(Trade.builder().member(owner).title("교환 게시글").build()).getId();
        pushTokenJpaRepository.save(PushToken.of(ownerId, token, PushPlatform.ANDROID));
        given(pushSender.send(anyList(), any())).willReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        List<Long> memberIds = List.of(ownerId, writerId);
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            entityManager.createQuery("DELETE FROM Notification n WHERE n.receiverId IN :memberIds")
                    .setParameter("memberIds", memberIds)
                    .executeUpdate();
            entityManager.createQuery("DELETE FROM PushToken p WHERE p.memberId IN :memberIds")
                    .setParameter("memberIds", memberIds)
                    .executeUpdate();
            // comment 는 DB 의 ON DELETE CASCADE 로 함께 지워진다.
            tradeJpaRepository.deleteAllByIdInBatch(List.of(tradeId));
            memberJpaRepository.deleteAllByIdInBatch(memberIds);
        });
    }

    @Test
    @DisplayName("댓글이 커밋되면 비동기로 게시글 작성자의 알림을 저장하고 푸시를 보낸다")
    void createComment_notifiesTradeOwner() {
        // when
        commentService.createComment(tradeId, writerId, MASKED_IP, new CommentCreateCommand(null, "교환 가능할까요?"));

        // then
        verify(pushSender, timeout(TIMEOUT_MILLIS)).send(eq(List.of(token)), any());
        assertThat(notificationJpaRepository.countByReceiverIdAndIsReadFalse(ownerId)).isEqualTo(1L);
    }

    @Test
    @DisplayName("게시글 작성자가 직접 단 댓글이면 알림도 푸시도 없다")
    void createComment_ownCommentDoesNotNotify() {
        // when
        commentService.createComment(tradeId, ownerId, MASKED_IP, new CommentCreateCommand(null, "본문 수정했어요"));

        // then
        verify(pushSender, after(1_000).never()).send(anyList(), any());
        assertThat(notificationJpaRepository.countByReceiverIdAndIsReadFalse(ownerId)).isZero();
    }

    private Member createMember(final String nickname) {
        return Member.builder()
                .oauthId(new OauthId(nickname + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername(nickname + "-oauth")
                .nickname(nickname)
                .build();
    }
}
