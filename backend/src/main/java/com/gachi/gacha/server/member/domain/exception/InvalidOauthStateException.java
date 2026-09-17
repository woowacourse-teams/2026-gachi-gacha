package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidStateException;

public class InvalidOauthStateException extends InvalidStateException {
    public InvalidOauthStateException(ErrorCode errorCode) {
        super(errorCode);
    }
}
