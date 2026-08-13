package com.gachi.gacha.server.gacha.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;

public class GachaImageInvalidValueException extends InvalidValueException {
    public GachaImageInvalidValueException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
