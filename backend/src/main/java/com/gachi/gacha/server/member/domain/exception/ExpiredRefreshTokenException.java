package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;

public class ExpiredRefreshTokenException extends UnAuthorizationException {
    public ExpiredRefreshTokenException(ErrorCode errorCode) {
        super(errorCode);
    }
}
