package com.gachi.gacha.server.chat.presentation.websocket;

import com.gachi.gacha.server.chat.application.ChatRoomService;
import com.gachi.gacha.server.chat.application.dto.ChatRoomUpdateInfo;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomUpdateResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatRoomUpdateSender {

    private static final String DESTINATION = "/queue/chat/rooms";

    private final ChatRoomService chatRoomService;
    private final SimpMessagingTemplate messagingTemplate;

    public void sendToMember(final Long memberId, final Long roomId) {
        try {
            ChatRoomUpdateInfo info =
                    chatRoomService.getRoomUpdate(memberId, roomId);

            ChatRoomUpdateResponse response =
                    new ChatRoomUpdateResponse(
                            ChatRoomResponse.from(info.room()),
                            info.totalUnreadCount()
                    );

            messagingTemplate.convertAndSendToUser(
                    String.valueOf(memberId),
                    DESTINATION,
                    response
            );
        } catch (Exception e) {
            log.error("채팅방 갱신 정보 전송 실패. memberId = {}, roomId = {}", memberId, roomId, e);
        }
    }

    public void sendToRoomMembers(final Long roomId) {
        List<Long> memberIds;
        try {
            memberIds = chatRoomService.getMemberIds(roomId);
        } catch (Exception e) {
            log.error("채팅방 참여자 조회 실패. roomId = {}", roomId, e);
            return;
        }

        for (Long memberId : memberIds) {
            sendToMember(memberId, roomId);
        }
    }
}
