package com.gachi.gacha.server.chat.presentation;

import com.gachi.gacha.server.chat.application.ChatMessageService;
import com.gachi.gacha.server.chat.application.dto.ChatMessageInfo;
import com.gachi.gacha.server.chat.presentation.dto.ChatMessageResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatMessageSendRequest;
import com.gachi.gacha.server.common.auth.websocket.StompPrincipal;
import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;
import com.gachi.gacha.server.common.exception.dto.ErrorResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.converter.MessageConversionException;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.support.MethodArgumentNotValidException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatMessageSocketController {

    private static final String ROOM_MESSAGE_DESTINATION = "/topic/chat/rooms/%d/messages";
    private static final String PERSONAL_ERROR_DESTINATION = "/queue/chat/errors";

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/rooms/{roomId}/messages")
    public void sendMessage(
            @DestinationVariable final Long roomId,
            final Principal principal,
            @Payload @Valid final ChatMessageSendRequest request
    ) {
        Long senderId = extractSenderId(principal);

        ChatMessageInfo chatMessageInfo = chatMessageService.sendMessage(senderId, roomId, request.toCommand());

        messagingTemplate.convertAndSend(
                ROOM_MESSAGE_DESTINATION.formatted(roomId),
                ChatMessageResponse.from(chatMessageInfo)
        );
    }

    @MessageExceptionHandler(BusinessException.class)
    @SendToUser(destinations = PERSONAL_ERROR_DESTINATION, broadcast = false)
    public ErrorResponse handleBusinessException(final BusinessException e) {
        log.warn("STOMP SEND BusinessException: {} - {}", e.getErrorCode(), e.getMessage());
        return ErrorResponse.of(e.getErrorCode());
    }

    @MessageExceptionHandler({MethodArgumentNotValidException.class, MessageConversionException.class})
    @SendToUser(destinations = PERSONAL_ERROR_DESTINATION, broadcast = false)
    public ErrorResponse handleInvalidRequest(final Exception e) {
        log.warn("STOMP SEND InvalidRequest: {}", e.getMessage());
        return ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE);
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser(destinations = PERSONAL_ERROR_DESTINATION, broadcast = false)
    public ErrorResponse handleException(final Exception e) {
        log.error("STOMP SEND Unhandled Exception: ", e);
        return ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    private Long extractSenderId(final Principal principal) {
        if (principal instanceof StompPrincipal stompPrincipal) {
            return stompPrincipal.memberId();
        }
        throw new UnAuthorizationException(ErrorCode.UNAUTHORIZATION_TOKEN);
    }
}
