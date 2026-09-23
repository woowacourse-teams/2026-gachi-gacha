package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnsupportedTypeException;

public class UnSupportedProviderTypeException extends UnsupportedTypeException {
    public UnSupportedProviderTypeException(ErrorCode errorCode) {
        super(errorCode);
    }
}
