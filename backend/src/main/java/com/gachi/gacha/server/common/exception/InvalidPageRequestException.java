package com.gachi.gacha.server.common.exception;

public class InvalidPageRequestException extends InvalidValueException {
    public InvalidPageRequestException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
