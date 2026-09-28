package com.gachi.gacha.server.common.exception;

public class UnAuthorizationException extends BusinessException {
    public UnAuthorizationException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
