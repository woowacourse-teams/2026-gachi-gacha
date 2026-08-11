package com.gachi.gacha.server.store.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;

public class InvalidStoreException extends InvalidValueException {

    public InvalidStoreException() {
        super(ErrorCode.INVALID_STORE_POLICY);
    }
}
