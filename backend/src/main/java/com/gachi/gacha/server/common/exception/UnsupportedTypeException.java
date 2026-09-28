package com.gachi.gacha.server.common.exception;

public class UnsupportedTypeException extends BusinessException {
    public UnsupportedTypeException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
