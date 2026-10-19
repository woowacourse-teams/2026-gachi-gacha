package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class BlockedChatNotAllowedException extends BusinessException {
    public BlockedChatNotAllowedException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
