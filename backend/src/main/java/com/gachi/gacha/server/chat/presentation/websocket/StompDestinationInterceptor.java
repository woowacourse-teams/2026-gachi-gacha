package com.gachi.gacha.server.chat.presentation.websocket;

import com.gachi.gacha.server.chat.application.ChatRoomService;
import com.gachi.gacha.server.chat.domain.exception.ChatRoomAccessDeniedException;
import com.gachi.gacha.server.common.auth.websocket.StompPrincipal;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.PathMatcher;

@Component
@RequiredArgsConstructor
public class StompDestinationInterceptor implements ChannelInterceptor {

    private static final String APPLICATION_PREFIX = "/app/";
    private static final String CHAT_ROOM_TOPIC = "/topic/chat/rooms/{roomId:\\d{1,18}}/messages";
    private static final Set<String> PERSONAL_DESTINATIONS = Set.of("/user/queue/chat/errors");

    private final PathMatcher pathMatcher = new AntPathMatcher();
    private final ChatRoomService chatRoomService;

    @Override
    public Message<?> preSend(final Message<?> message, final MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (StompCommand.SUBSCRIBE.equals(command)) {
            validateSubscribe(accessor);
        }
        if (StompCommand.SEND.equals(command)) {
            validateSend(accessor);
        }
        return message;
    }

    private void validateSubscribe(final StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            throw accessDenied();
        }
        if (PERSONAL_DESTINATIONS.contains(destination)) {
            return;
        }
        if (!pathMatcher.match(CHAT_ROOM_TOPIC, destination)) {
            throw accessDenied();
        }
        Long roomId = Long.valueOf(
                pathMatcher.extractUriTemplateVariables(CHAT_ROOM_TOPIC, destination).get("roomId"));
        chatRoomService.validateMember(roomId, extractMemberId(accessor));
    }

    private void validateSend(final StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith(APPLICATION_PREFIX)) {
            throw accessDenied();
        }
    }

    private Long extractMemberId(final StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof StompPrincipal principal) {
            return principal.memberId();
        }
        throw new UnAuthorizationException(ErrorCode.UNAUTHORIZATION_TOKEN);
    }

    private ChatRoomAccessDeniedException accessDenied() {
        return new ChatRoomAccessDeniedException(ErrorCode.CHAT_ROOM_ACCESS_DENIED);
    }
}
