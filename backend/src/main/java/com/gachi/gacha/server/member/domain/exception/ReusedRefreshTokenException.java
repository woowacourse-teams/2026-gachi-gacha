package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;

public class ReusedRefreshTokenException extends UnAuthorizationException {
    public ReusedRefreshTokenException(ErrorCode errorCode) {
        super(errorCode);
    }
}
