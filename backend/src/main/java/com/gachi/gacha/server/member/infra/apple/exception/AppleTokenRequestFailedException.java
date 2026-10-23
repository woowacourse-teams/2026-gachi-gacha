package com.gachi.gacha.server.member.infra.apple.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.ExternalApiException;

public class AppleTokenRequestFailedException extends ExternalApiException {

    public AppleTokenRequestFailedException(ErrorCode errorCode) {
        super(errorCode);
    }
}
