package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;

public class SelfBlockNotAllowedException extends InvalidValueException {
    public SelfBlockNotAllowedException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
