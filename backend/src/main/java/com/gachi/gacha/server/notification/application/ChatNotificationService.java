package com.gachi.gacha.server.notification.application;

import com.gachi.gacha.server.chat.application.event.ChatMessageSentEvent;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 채팅 메시지를 받은 상대에게 푸시를 보낸다. 채팅방 목록과 안 읽은 수가 기록 역할을 하므로 알림은 저장하지 않는다.
 *
 * <p>차단 관계에서는 메시지 송신 자체가 거절되므로 여기서 차단을 다시 확인하지 않는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatNotificationService {

    private final MemberJpaRepository memberJpaRepository;
    private final ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;
    private final PushService pushService;

    public void notifyReceivers(final ChatMessageSentEvent event) {
        findSenderName(event.senderId())
                .map(senderName -> PushMessage.ofChat(event.roomId(), senderName, event.preview()))
                .ifPresentOrElse(
                        message -> sendToReceivers(event, message),
                        () -> log.warn("채팅 푸시 생략: 보낸 회원을 찾을 수 없음. roomId = {}, senderId = {}",
                                event.roomId(), event.senderId())
                );
    }

    private Optional<String> findSenderName(final Long senderId) {
        return memberJpaRepository.findById(senderId)
                .map(Member::getNickname);
    }

    private void sendToReceivers(final ChatMessageSentEvent event, final PushMessage message) {
        chatRoomMemberJpaRepository.findMemberIdsByRoomId(event.roomId())
                .stream()
                .filter(memberId -> !memberId.equals(event.senderId()))
                .forEach(receiverId -> pushService.sendTo(receiverId, message));
    }
}
