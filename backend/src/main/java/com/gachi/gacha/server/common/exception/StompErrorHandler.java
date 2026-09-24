package com.gachi.gacha.server.common.exception;

import com.gachi.gacha.server.common.exception.dto.ErrorResponse;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompErrorHandler extends StompSubProtocolErrorHandler {

    private final JsonMapper jsonMapper;

    @Override
    public Message<byte[]> handleClientMessageProcessingError(
            @Nullable final Message<byte[]> clientMessage,
            final Throwable ex
    ) {
        ErrorCode errorCode = resolveErrorCode(ex);
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.ERROR);
        accessor.setMessage(errorCode.getCode());
        accessor.setContentType(MimeTypeUtils.APPLICATION_JSON);
        accessor.setLeaveMutable(true);

        byte[] payload = jsonMapper.writeValueAsBytes(ErrorResponse.of(errorCode));

        StompHeaderAccessor clientAccessor = clientMessage == null ? null
                : MessageHeaderAccessor.getAccessor(clientMessage, StompHeaderAccessor.class);
        return handleInternal(accessor, payload, ex, clientAccessor);
    }

    private ErrorCode resolveErrorCode(final Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof BusinessException businessException) {
                log.warn("STOMP BusinessException: {} - {}",
                        businessException.getErrorCode(), businessException.getMessage());
                return businessException.getErrorCode();
            }
            current = current.getCause();
        }
        log.error("STOMP Unhandled Exception: ", ex);
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
}
