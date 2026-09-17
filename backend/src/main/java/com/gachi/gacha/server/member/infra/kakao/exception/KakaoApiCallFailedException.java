package com.gachi.gacha.server.member.infra.kakao.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.ExternalApiException;

public class KakaoApiCallFailedException extends ExternalApiException {
    public KakaoApiCallFailedException(ErrorCode errorCode) {
        super(errorCode);
    }
}
