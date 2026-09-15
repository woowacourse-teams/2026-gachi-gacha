package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnsupportedTypeException;

public class UnSupportedServerTypeException extends UnsupportedTypeException {
    public UnSupportedServerTypeException(ErrorCode errorCode) {
        super(errorCode);
    }
}
