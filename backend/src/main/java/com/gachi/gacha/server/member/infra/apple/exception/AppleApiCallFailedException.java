package com.gachi.gacha.server.member.infra.apple.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.ExternalApiException;

public class AppleApiCallFailedException extends ExternalApiException {

    public AppleApiCallFailedException(ErrorCode errorCode) {
        super(errorCode);
    }
}
