package com.gachi.gacha.server.common.exception;

public class EntityNotFoundException extends BusinessException {
    public EntityNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
