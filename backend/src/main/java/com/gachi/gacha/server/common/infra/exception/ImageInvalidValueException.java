package com.gachi.gacha.server.common.infra.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;

public class ImageInvalidValueException extends InvalidValueException {
    public ImageInvalidValueException(ErrorCode errorCode) {
        super(errorCode);
    }
}
