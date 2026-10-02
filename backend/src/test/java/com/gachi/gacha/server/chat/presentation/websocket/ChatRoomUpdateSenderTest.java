package com.gachi.gacha.server.chat.presentation.websocket;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.gachi.gacha.server.chat.application.ChatRoomService;
import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import com.gachi.gacha.server.chat.application.dto.ChatRoomUpdateInfo;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomUpdateResponse;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class ChatRoomUpdateSenderTest {

    private static final Long ROOM_ID = 1L;
    private static final Long FIRST_MEMBER_ID = 2L;
    private static final Long SECOND_MEMBER_ID = 3L;
    private static final String DESTINATION = "/queue/chat/rooms";

    @Mock
    private ChatRoomService chatRoomService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ChatRoomUpdateSender sender;

    @Test
    @DisplayName("갱신 정보 조회가 실패해도 이미 완료된 요청에 예외를 전파하지 않는다")
    void sendToMember_queryFailureDoesNotPropagate() {
        given(chatRoomService.getRoomWithTotalUnreadCount(FIRST_MEMBER_ID, ROOM_ID))
                .willThrow(new IllegalStateException("조회 실패"));

        assertThatCode(() -> sender.sendToMember(FIRST_MEMBER_ID, ROOM_ID))
                .doesNotThrowAnyException();

        verifyNoInteractions(messagingTemplate);
    }

    @Test
    @DisplayName("참여자 조회가 실패하면 전송을 중단하고 예외를 전파하지 않는다")
    void sendToRoomMembers_memberQueryFailureDoesNotPropagate() {
        given(chatRoomService.getMemberIds(ROOM_ID))
                .willThrow(new IllegalStateException("참여자 조회 실패"));

        assertThatCode(() -> sender.sendToRoomMembers(ROOM_ID))
                .doesNotThrowAnyException();

        verify(chatRoomService, never()).getRoomWithTotalUnreadCount(any(), any());
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    @DisplayName("첫 참여자의 갱신 정보 조회가 실패해도 다음 참여자에게 전송한다")
    void sendToRoomMembers_continuesAfterMemberQueryFailure() {
        given(chatRoomService.getMemberIds(ROOM_ID))
                .willReturn(List.of(FIRST_MEMBER_ID, SECOND_MEMBER_ID));
        given(chatRoomService.getRoomWithTotalUnreadCount(FIRST_MEMBER_ID, ROOM_ID))
                .willThrow(new IllegalStateException("첫 참여자 조회 실패"));
        given(chatRoomService.getRoomWithTotalUnreadCount(SECOND_MEMBER_ID, ROOM_ID)).willReturn(updateInfo());

        assertThatCode(() -> sender.sendToRoomMembers(ROOM_ID)).doesNotThrowAnyException();

        verify(messagingTemplate, never()).convertAndSendToUser(
                eq(String.valueOf(FIRST_MEMBER_ID)), eq(DESTINATION), any(ChatRoomUpdateResponse.class));
        verify(messagingTemplate).convertAndSendToUser(
                eq(String.valueOf(SECOND_MEMBER_ID)), eq(DESTINATION), any(ChatRoomUpdateResponse.class));
    }

    @Test
    @DisplayName("첫 참여자의 웹소켓 전송이 실패해도 다음 참여자에게 전송하고 예외를 전파하지 않는다")
    void sendToRoomMembers_continuesAfterDeliveryFailure() {
        given(chatRoomService.getMemberIds(ROOM_ID))
                .willReturn(List.of(FIRST_MEMBER_ID, SECOND_MEMBER_ID));
        given(chatRoomService.getRoomWithTotalUnreadCount(FIRST_MEMBER_ID, ROOM_ID)).willReturn(updateInfo());
        given(chatRoomService.getRoomWithTotalUnreadCount(SECOND_MEMBER_ID, ROOM_ID)).willReturn(updateInfo());
        doThrow(new MessageDeliveryException("전송 실패")).when(messagingTemplate).convertAndSendToUser(
                eq(String.valueOf(FIRST_MEMBER_ID)), eq(DESTINATION), any(ChatRoomUpdateResponse.class));

        assertThatCode(() -> sender.sendToRoomMembers(ROOM_ID)).doesNotThrowAnyException();

        verify(messagingTemplate).convertAndSendToUser(
                eq(String.valueOf(SECOND_MEMBER_ID)), eq(DESTINATION), any(ChatRoomUpdateResponse.class));
    }

    private ChatRoomUpdateInfo updateInfo() {
        ChatRoomInfo room = ChatRoomInfo.builder()
                .roomId(ROOM_ID)
                .trade(new ChatRoomInfo.TradeSummary(1L, "교환 게시글", null, TradeStatus.AVAILABLE))
                .otherMember(new ChatRoomInfo.MemberSummary(FIRST_MEMBER_ID, "상대방", null))
                .lastMessage(new ChatRoomInfo.LastMessageSummary("안녕하세요", LocalDateTime.of(2026, 9, 29, 12, 0)))
                .unreadCount(1L)
                .createdAt(LocalDateTime.of(2026, 9, 28, 12, 0))
                .build();
        return new ChatRoomUpdateInfo(room, 3L);
    }
}
