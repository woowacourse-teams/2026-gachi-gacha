package com.gachi.gacha.server.common.exception;

public class InvalidValueException extends BusinessException {
    public InvalidValueException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
