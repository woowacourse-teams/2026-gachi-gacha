package com.gachi.gacha.server.chat.domain.exception;

import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class SelfChatNotAllowedException extends BusinessException {

    public SelfChatNotAllowedException(ErrorCode errorCode) {
        super(errorCode);
    }
}
