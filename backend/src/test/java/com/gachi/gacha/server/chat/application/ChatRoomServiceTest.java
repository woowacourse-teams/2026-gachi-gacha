package com.gachi.gacha.server.chat.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.chat.domain.exception.ChatPartnerWithdrawnException;
import com.gachi.gacha.server.member.application.MemberBlockService;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.exception.BlockedChatNotAllowedException;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;
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

    @Autowired
    private ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;

    @Autowired
    private EntityManager entityManager;

    private Member owner;
    private Member requester;
    private Member otherOwner;

    @BeforeEach
    void setUp() {
        owner = memberJpaRepository.save(Member.builder()
                .nickname("owner")
                .profileImageUrl("owner-profile")
                .build());
        requester = memberJpaRepository.save(Member.builder().nickname("requester").build());
        otherOwner = memberJpaRepository.save(Member.builder().nickname("otherOwner").build());
    }

    @Nested
    @DisplayName("탈퇴 회원과의 채팅방 조회")
    class GetRoomsWithDeletedMember {

        @Test
        @DisplayName("전용 조회는 탈퇴 회원을 포함하며 일반 회원 조회는 계속 제외한다")
        void findOtherMemberIncludingDeleted() {
            Long roomId = createRoom(requester, owner);
            Long ownerId = owner.getId();
            Long requesterId = requester.getId();
            entityManager.flush();
            entityManager.clear();
            memberJpaRepository.delete(memberJpaRepository.getMemberById(ownerId));
            memberJpaRepository.flush();
            entityManager.clear();

            assertThat(memberJpaRepository.findById(ownerId)).isEmpty();
            assertThat(chatRoomMemberJpaRepository.findOtherMemberIncludingDeleted(roomId, requesterId))
                    .hasValueSatisfying(member -> {
                        assertThat(member.getRoomId()).isEqualTo(roomId);
                        assertThat(member.getMemberId()).isEqualTo(ownerId);
                        assertThat(member.getNickname()).isEqualTo("owner");
                        assertThat(member.getProfileImageUrl()).isEqualTo("owner-profile");
                        assertThat(member.getDeleted()).isTrue();
                    });
            assertThat(chatRoomMemberJpaRepository.findOtherMembersIncludingDeleted(
                    List.of(roomId), requesterId
            )).singleElement().satisfies(member -> assertThat(member.getMemberId()).isEqualTo(ownerId));
        }

        @Test
        @DisplayName("탈퇴 회원이 있는 방과 정상 회원의 방을 목록에서 함께 반환하고 상세도 조회한다")
        void getRoomsAndRoom_includeDeletedMember() {
            Long deletedMemberRoomId = createRoom(requester, owner);
            Long activeMemberRoomId = createRoom(requester, otherOwner);
            Long ownerId = owner.getId();
            Long requesterId = requester.getId();
            entityManager.flush();
            entityManager.clear();
            memberJpaRepository.delete(memberJpaRepository.getMemberById(ownerId));
            memberJpaRepository.flush();
            entityManager.clear();

            List<ChatRoomInfo> rooms = chatRoomService.getRooms(requesterId);
            assertThat(rooms)
                    .extracting(ChatRoomInfo::roomId)
                    .containsExactly(activeMemberRoomId, deletedMemberRoomId);
            assertThat(rooms)
                    .filteredOn(room -> room.roomId().equals(deletedMemberRoomId))
                    .singleElement()
                    .satisfies(room -> {
                        assertThat(room.otherMember().memberId()).isEqualTo(ownerId);
                        assertThat(room.otherMember().nickname()).isEqualTo("탈퇴한 사용자");
                        assertThat(room.otherMember().profileImageUrl()).isNull();
                    });
            assertThat(rooms)
                    .filteredOn(room -> room.roomId().equals(activeMemberRoomId))
                    .singleElement()
                    .satisfies(room -> assertThat(room.otherMember().nickname()).isEqualTo("otherOwner"));
            ChatRoomInfo deletedMemberRoom = chatRoomService.getRoom(requesterId, deletedMemberRoomId);
            assertThat(deletedMemberRoom.otherMember().memberId()).isEqualTo(ownerId);
            assertThat(deletedMemberRoom.otherMember().nickname()).isEqualTo("탈퇴한 사용자");
            assertThat(deletedMemberRoom.otherMember().profileImageUrl()).isNull();
        }
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
    @DisplayName("탈퇴 회원과의 채팅 시작")
    class StartChatWithDeletedMember {

        @Test
        @DisplayName("게시글 작성자가 탈퇴했으면 채팅방을 저장하지 않고 생성을 거절한다")
        void createRoom_tradeOwnerDeleted() {
            // given
            Trade trade = saveTrade(owner);
            Long tradeId = trade.getId();
            Long requesterId = requester.getId();
            entityManager.flush();
            entityManager.clear();
            memberJpaRepository.delete(memberJpaRepository.getMemberById(owner.getId()));
            memberJpaRepository.flush();
            entityManager.clear();

            // when & then
            assertThatThrownBy(() -> chatRoomService.createRoom(requesterId, tradeId))
                    .isInstanceOf(ChatPartnerWithdrawnException.class);
            assertThat(chatRoomJpaRepository.findByTradeIdAndRequesterId(tradeId, requesterId))
                    .isEmpty();
        }

        @Test
        @DisplayName("게시글 작성자가 정상 회원이면 채팅방을 생성한다")
        void createRoom_tradeOwnerActive() {
            // given
            Trade trade = saveTrade(owner);

            // when
            Long roomId = chatRoomService.createRoom(requester.getId(), trade.getId()).roomId();

            // then
            assertThat(chatRoomJpaRepository.findByTradeIdAndRequesterId(trade.getId(), requester.getId()))
                    .hasValueSatisfying(room -> assertThat(room.getId()).isEqualTo(roomId));
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
