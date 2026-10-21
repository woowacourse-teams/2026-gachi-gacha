package com.gachi.gacha.server.notification.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.chat.application.ChatMessageService;
import com.gachi.gacha.server.chat.application.dto.ChatMessageSendCommand;
import com.gachi.gacha.server.chat.domain.ChatMessageMongoRepository;
import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.chat.domain.MessageType;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 메시지 송신 커밋 이후 비동기로 상대에게 푸시가 나가는 전체 흐름을 검증한다.
 *
 * <p>트랜잭션을 건 테스트는 커밋하지 않아 AFTER_COMMIT 리스너가 실행되지 않는다. 그래서 테스트 자체에는
 * 트랜잭션을 걸지 않고, 데이터는 직접 만들고 지운다.
 */
@SpringBootTest
class ChatNotificationFlowTest {

    private static final long TIMEOUT_MILLIS = 5_000;

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private ChatRoomJpaRepository chatRoomJpaRepository;

    @Autowired
    private ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;

    @Autowired
    private ChatMessageMongoRepository chatMessageMongoRepository;

    @Autowired
    private PushTokenJpaRepository pushTokenJpaRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    @MockitoBean
    private PushSender pushSender;

    private final String ownerToken = "owner-token-" + UUID.randomUUID();

    private Long ownerId;
    private Long requesterId;
    private Long tradeId;
    private Long roomId;

    @BeforeEach
    void setUp() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            Member owner = memberJpaRepository.save(createMember("owner"));
            Member requester = memberJpaRepository.save(createMember("requester"));
            ownerId = owner.getId();
            requesterId = requester.getId();
            tradeId = tradeJpaRepository.save(Trade.builder().member(owner).title("교환 게시글").build()).getId();

            ChatRoom room = chatRoomJpaRepository.save(ChatRoom.create(tradeId, requesterId));
            roomId = room.getId();
            chatRoomMemberJpaRepository.saveAll(List.of(
                    ChatRoomMember.join(room, owner),
                    ChatRoomMember.join(room, requester)
            ));
            pushTokenJpaRepository.save(PushToken.of(ownerId, ownerToken, PushPlatform.ANDROID));
        });
        given(pushSender.send(anyList(), any())).willReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        chatMessageMongoRepository.deleteAll(
                chatMessageMongoRepository.findByRoomIdOrderBySequenceDesc(roomId, PageRequest.of(0, 100))
        );
        List<Long> memberIds = List.of(ownerId, requesterId);
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            entityManager.createQuery("DELETE FROM PushToken p WHERE p.memberId IN :memberIds")
                    .setParameter("memberIds", memberIds)
                    .executeUpdate();
            entityManager.createQuery("DELETE FROM ChatRoomMember m WHERE m.chatRoom.id = :roomId")
                    .setParameter("roomId", roomId)
                    .executeUpdate();
            chatRoomJpaRepository.deleteAllByIdInBatch(List.of(roomId));
            tradeJpaRepository.deleteAllByIdInBatch(List.of(tradeId));
            memberJpaRepository.deleteAllByIdInBatch(memberIds);
        });
    }

    @Test
    @DisplayName("메시지가 커밋되면 비동기로 채팅방 상대에게 채팅방 단위로 묶이는 푸시를 보낸다")
    void sendMessage_pushesToReceiver() {
        // when
        chatMessageService.sendMessage(
                requesterId,
                roomId,
                new ChatMessageSendCommand(MessageType.TEXT, "오늘 교환 가능할까요?", List.of())
        );

        // then
        verify(pushSender, timeout(TIMEOUT_MILLIS)).send(
                eq(List.of(ownerToken)),
                argThat(message -> message.title().equals("requester")
                        && message.body().equals("오늘 교환 가능할까요?")
                        && ("chat-" + roomId).equals(message.collapseKey()))
        );
    }

    private Member createMember(final String nickname) {
        return Member.builder()
                .oauthId(new OauthId(nickname + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername(nickname + "-oauth")
                .nickname(nickname)
                .build();
    }
}
