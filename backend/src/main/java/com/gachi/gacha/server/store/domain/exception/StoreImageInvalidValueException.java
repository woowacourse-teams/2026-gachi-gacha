package com.gachi.gacha.server.store.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;

public class StoreImageInvalidValueException extends InvalidValueException {
    public StoreImageInvalidValueException(ErrorCode errorCode) {
        super(errorCode);
    }
}
