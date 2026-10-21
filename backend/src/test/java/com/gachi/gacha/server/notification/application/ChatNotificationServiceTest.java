package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.chat.application.event.ChatMessageSentEvent;
import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class ChatNotificationServiceTest {

    @Autowired
    private ChatNotificationService chatNotificationService;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private ChatRoomJpaRepository chatRoomJpaRepository;

    @Autowired
    private ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;

    @Autowired
    private PushTokenJpaRepository pushTokenJpaRepository;

    @MockitoBean
    private PushSender pushSender;

    private Member owner;
    private Member requester;
    private ChatRoom room;

    @BeforeEach
    void setUp() {
        owner = memberJpaRepository.save(Member.builder().nickname("owner").build());
        requester = memberJpaRepository.save(Member.builder().nickname("requester").build());
        Trade trade = tradeJpaRepository.save(Trade.builder().member(owner).title("교환 게시글").build());
        room = chatRoomJpaRepository.save(ChatRoom.create(trade.getId(), requester.getId()));
        chatRoomMemberJpaRepository.saveAll(List.of(
                ChatRoomMember.join(room, owner),
                ChatRoomMember.join(room, requester)
        ));
        pushTokenJpaRepository.save(PushToken.of(owner.getId(), "owner-token", PushPlatform.ANDROID));
        pushTokenJpaRepository.save(PushToken.of(requester.getId(), "requester-token", PushPlatform.IOS));
        given(pushSender.send(anyList(), any())).willReturn(List.of());
    }

    @Test
    @DisplayName("보낸 사람을 제외한 채팅방 상대에게 보낸 사람 닉네임과 미리보기로 푸시를 보낸다")
    void notifyReceivers() {
        // when
        chatNotificationService.notifyReceivers(new ChatMessageSentEvent(room.getId(), requester.getId(), "사진"));

        // then
        ArgumentCaptor<PushMessage> messageCaptor = ArgumentCaptor.forClass(PushMessage.class);
        verify(pushSender).send(eq(List.of("owner-token")), messageCaptor.capture());
        verify(pushSender, never()).send(eq(List.of("requester-token")), any());

        PushMessage message = messageCaptor.getValue();
        assertThat(message.title()).isEqualTo("requester");
        assertThat(message.body()).isEqualTo("사진");
        assertThat(message.data())
                .containsEntry("type", "CHAT")
                .containsEntry("roomId", String.valueOf(room.getId()));
        assertThat(message.collapseKey()).isEqualTo("chat-" + room.getId());
    }

    @Test
    @DisplayName("보낸 사람이 탈퇴해 조회되지 않으면 푸시를 보내지 않는다")
    void notifyReceivers_withdrawnSender() {
        // given
        memberJpaRepository.delete(requester);

        // when
        chatNotificationService.notifyReceivers(new ChatMessageSentEvent(room.getId(), requester.getId(), "안녕하세요"));

        // then
        verify(pushSender, never()).send(anyList(), any());
    }
}
