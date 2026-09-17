package com.gachi.gacha.server.common.exception;

public class UnsupportedTypeException extends BusinessException {
    public UnsupportedTypeException(ErrorCode errorCode) {
        super(errorCode);
    }
}
