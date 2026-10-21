package com.gachi.gacha.server.chat.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.member.application.MemberBlockService;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.exception.BlockedChatNotAllowedException;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class ChatRoomServiceTest {

    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private MemberBlockService memberBlockService;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private ChatRoomJpaRepository chatRoomJpaRepository;

    private Member owner;
    private Member requester;
    private Member otherOwner;

    @BeforeEach
    void setUp() {
        owner = memberJpaRepository.save(Member.builder().nickname("owner").build());
        requester = memberJpaRepository.save(Member.builder().nickname("requester").build());
        otherOwner = memberJpaRepository.save(Member.builder().nickname("otherOwner").build());
    }

    @Nested
    @DisplayName("차단 관계의 채팅방 목록 조회")
    class GetRoomsWithBlock {

        @Test
        @DisplayName("한쪽이 차단하면 양쪽 목록에서 상대와의 모든 채팅방을 제외한다")
        void getRooms_excludesAllRoomsWithBlockedMember() {
            // given
            createRoom(requester, owner);
            createRoom(requester, owner);
            Long otherRoomId = createRoom(requester, otherOwner);
            memberBlockService.block(owner.getId(), requester.getId());

            // when & then
            assertThat(chatRoomService.getRooms(requester.getId()))
                    .extracting(ChatRoomInfo::roomId)
                    .containsExactly(otherRoomId);
            assertThat(chatRoomService.getRooms(owner.getId())).isEmpty();
        }

        @Test
        @DisplayName("차단을 해제하면 숨겼던 채팅방이 다시 조회된다")
        void getRooms_showsRoomAgainAfterUnblock() {
            // given
            Long roomId = createRoom(requester, owner);
            memberBlockService.block(requester.getId(), owner.getId());
            memberBlockService.unblock(requester.getId(), owner.getId());

            // when & then
            assertThat(chatRoomService.getRooms(requester.getId()))
                    .extracting(ChatRoomInfo::roomId)
                    .containsExactly(roomId);
        }
    }

    @Nested
    @DisplayName("차단 관계의 전체 안 읽은 수 조회")
    class GetUnreadCountWithBlock {

        @Test
        @DisplayName("차단 관계인 채팅방의 안 읽은 메시지는 전체 안 읽은 수에서 제외한다")
        void getUnreadCount_excludesBlockedRooms() {
            // given
            Long blockedRoomId = createRoom(requester, owner);
            Long visibleRoomId = createRoom(requester, otherOwner);
            appendMessages(blockedRoomId, 2);
            appendMessages(visibleRoomId, 1);
            memberBlockService.block(requester.getId(), owner.getId());

            // when & then
            assertThat(chatRoomService.getUnreadCount(requester.getId())).isEqualTo(1L);
        }
    }

    @Nested
    @DisplayName("차단 관계의 채팅 시작")
    class StartChatWithBlock {

        @Test
        @DisplayName("게시글 작성자와 차단 관계면 채팅방 존재 조회를 거절한다")
        void findRoomExistence_blocked() {
            // given
            Trade trade = saveTrade(owner);
            memberBlockService.block(owner.getId(), requester.getId());

            // when & then
            assertThatThrownBy(() -> chatRoomService.findRoomExistence(requester.getId(), trade.getId()))
                    .isInstanceOf(BlockedChatNotAllowedException.class);
        }

        @Test
        @DisplayName("게시글 작성자와 차단 관계면 채팅방을 저장하지 않고 생성을 거절한다")
        void createRoom_blocked() {
            // given
            Trade trade = saveTrade(owner);
            memberBlockService.block(requester.getId(), owner.getId());

            // when & then
            assertThatThrownBy(() -> chatRoomService.createRoom(requester.getId(), trade.getId()))
                    .isInstanceOf(BlockedChatNotAllowedException.class);
            assertThat(chatRoomJpaRepository.findByTradeIdAndRequesterId(trade.getId(), requester.getId()))
                    .isEmpty();
        }
    }

    @Nested
    @DisplayName("채팅방 실시간 갱신 정보 조회")
    class FindRoomUpdate {

        @Test
        @DisplayName("차단 관계인 상대와의 채팅방이면 갱신 정보를 반환하지 않는다")
        void findRoomUpdate_blocked() {
            // given
            Long roomId = createRoom(requester, owner);
            memberBlockService.block(owner.getId(), requester.getId());

            // when & then
            assertThat(chatRoomService.findRoomUpdate(requester.getId(), roomId)).isEmpty();
            assertThat(chatRoomService.findRoomUpdate(owner.getId(), roomId)).isEmpty();
        }

        @Test
        @DisplayName("차단 관계가 아니면 채팅방과 전체 안 읽은 수를 반환한다")
        void findRoomUpdate_notBlocked() {
            // given
            Long roomId = createRoom(requester, owner);

            // when & then
            assertThat(chatRoomService.findRoomUpdate(requester.getId(), roomId))
                    .hasValueSatisfying(update -> assertThat(update.room().roomId()).isEqualTo(roomId));
        }
    }

    private Long createRoom(final Member chatRequester, final Member tradeOwner) {
        Trade trade = saveTrade(tradeOwner);
        return chatRoomService.createRoom(chatRequester.getId(), trade.getId()).roomId();
    }

    private Trade saveTrade(final Member tradeOwner) {
        return tradeJpaRepository.save(Trade.builder().member(tradeOwner).title("교환 게시글").build());
    }

    private void appendMessages(final Long roomId, final int count) {
        for (int i = 0; i < count; i++) {
            chatRoomJpaRepository.getById(roomId).appendMessage("안녕하세요", LocalDateTime.now());
        }
    }
}
