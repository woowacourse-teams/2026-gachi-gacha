package com.gachi.gacha.server.store.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;

public class InvalidNearbyRequestException extends InvalidValueException {
    public InvalidNearbyRequestException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
