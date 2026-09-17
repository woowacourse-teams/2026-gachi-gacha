package com.gachi.gacha.server.member.infra.naver.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.ExternalApiException;

public class NaverTokenRequestFailedException extends ExternalApiException {
    public NaverTokenRequestFailedException(ErrorCode errorCode) {
        super(errorCode);
    }
}
