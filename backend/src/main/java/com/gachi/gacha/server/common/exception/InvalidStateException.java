package com.gachi.gacha.server.common.exception;

public class InvalidStateException extends BusinessException {
    public InvalidStateException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
