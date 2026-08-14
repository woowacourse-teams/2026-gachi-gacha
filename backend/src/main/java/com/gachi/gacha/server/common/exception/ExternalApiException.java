package com.gachi.gacha.server.common.exception;

public class ExternalApiException extends BusinessException {
    public ExternalApiException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
