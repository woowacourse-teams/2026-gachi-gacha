package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;

public class InvalidRefreshTokenException extends UnAuthorizationException {
    public InvalidRefreshTokenException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
