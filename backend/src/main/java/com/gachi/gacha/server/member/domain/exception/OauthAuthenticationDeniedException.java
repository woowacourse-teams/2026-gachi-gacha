package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;

public class OauthAuthenticationDeniedException extends UnAuthorizationException {
    public OauthAuthenticationDeniedException(ErrorCode errorCode) {
        super(errorCode);
    }
}
