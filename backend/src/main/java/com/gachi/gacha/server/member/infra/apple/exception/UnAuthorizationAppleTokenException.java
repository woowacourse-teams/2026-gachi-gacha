package com.gachi.gacha.server.member.infra.apple.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;

public class UnAuthorizationAppleTokenException extends UnAuthorizationException {

    public UnAuthorizationAppleTokenException(ErrorCode errorCode) {
        super(errorCode);
    }
}
