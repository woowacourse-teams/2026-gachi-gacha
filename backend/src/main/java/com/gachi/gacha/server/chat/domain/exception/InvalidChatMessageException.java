package com.gachi.gacha.server.chat.domain.exception;

import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class InvalidChatMessageException extends BusinessException {

    public InvalidChatMessageException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
