package com.gachi.gacha.server.chat.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.chat.application.dto.ChatMessageInfo;
import com.gachi.gacha.server.chat.application.dto.ChatMessageSendCommand;
import com.gachi.gacha.server.chat.domain.ChatMessage;
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
import com.gachi.gacha.server.trade.domain.Place;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Mongo 저장은 JPA 트랜잭션에 묶이지 않아, Postgres 롤백 시 고아 문서가 남을 수 있다.
 * 보상 삭제가 이를 정리하지만 응답 타임아웃·보상 삭제 실패·프로세스 종료 구간은 놓친다.
 * 그때 남은 고아 문서를 다음 전송이 스스로 정리하고 복구하는지 검증한다.
 */
@SpringBootTest
@Transactional
class ChatMessageOrphanRecoveryTest {

    private static final String ORPHAN_CONTENT = "커밋되지 못한 고아 메시지";
    private static final String NEW_CONTENT = "정상적으로 전송된 메시지";

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private ChatRoomJpaRepository chatRoomJpaRepository;

    @Autowired
    private ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private ChatMessageMongoRepository chatMessageMongoRepository;

    private Long roomId;
    private Long senderId;

    @BeforeEach
    void setUp() {
        Member owner = memberJpaRepository.save(createMember("owner"));
        Member requester = memberJpaRepository.save(createMember("requester"));
        Trade trade = tradeJpaRepository.save(createTrade(owner));

        ChatRoom chatRoom = chatRoomJpaRepository.save(ChatRoom.create(trade.getId(), requester.getId()));
        chatRoomMemberJpaRepository.saveAll(List.of(
                ChatRoomMember.join(chatRoom, owner),
                ChatRoomMember.join(chatRoom, requester)
        ));

        roomId = chatRoom.getId();
        senderId = requester.getId();
        deleteMessages();
    }

    @AfterEach
    void tearDown() {
        deleteMessages();
    }

    @Test
    @DisplayName("직전 전송이 남긴 고아 문서가 있어도 다음 전송은 성공하고 문서는 1건만 남는다")
    void sendMessage_recoversFromOrphanDocument() {
        long nextSequence = 1L;
        chatMessageMongoRepository.save(ChatMessage.create(
                roomId, senderId, nextSequence, MessageType.TEXT, ORPHAN_CONTENT, List.of()));

        ChatMessageInfo result = chatMessageService.sendMessage(senderId, roomId, textCommand());

        assertThat(result.sequence()).isEqualTo(nextSequence);
        List<ChatMessage> stored = findMessages();
        assertThat(stored).hasSize(1);
        assertThat(stored.get(0).getContent()).isEqualTo(NEW_CONTENT);
    }

    @Test
    @DisplayName("고아 문서를 정리하고 재시도한 메시지도 createdAt이 채워진다")
    void sendMessage_retriedMessageHasCreatedAt() {
        chatMessageMongoRepository.save(ChatMessage.create(
                roomId, senderId, 1L, MessageType.TEXT, ORPHAN_CONTENT, List.of()));

        chatMessageService.sendMessage(senderId, roomId, textCommand());

        ChatMessage stored = findMessages().get(0);
        assertThat(stored.getCreatedAt()).isNotNull();
    }

    private ChatMessageSendCommand textCommand() {
        return new ChatMessageSendCommand(MessageType.TEXT, NEW_CONTENT, List.of());
    }

    private List<ChatMessage> findMessages() {
        return chatMessageMongoRepository.findByRoomIdOrderBySequenceDesc(roomId, PageRequest.of(0, 100));
    }

    private void deleteMessages() {
        chatMessageMongoRepository.deleteAll(findMessages());
    }

    private Member createMember(final String nickname) {
        return Member.builder()
                .oauthId(new OauthId(nickname + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername(nickname + "-oauth")
                .nickname(nickname)
                .profileImageUrl("https://example.com/profile/" + nickname + ".png")
                .desireTradeLocation("강남역")
                .build();
    }

    private Trade createTrade(final Member member) {
        return Trade.builder()
                .member(member)
                .title("가챠 교환합니다")
                .description("개봉만 한 상품입니다.")
                .desiredProduction("시나모롤")
                .purchaseStore(new Place("가챠샵 홍대점", "서울특별시 마포구 양화로 100", 37.5563, 126.9236))
                .tradePlace(new Place("홍대입구역 8번 출구", "서울특별시 마포구 양화로 160", 37.5570, 126.9245))
                .availableTime(LocalDateTime.of(2026, 9, 20, 19, 0))
                .status(TradeStatus.AVAILABLE)
                .build();
    }
}
