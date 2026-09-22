package com.gachi.gacha.server.chat.domain.exception;

import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class ChatMemberNotFoundException extends BusinessException {

    public ChatMemberNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
