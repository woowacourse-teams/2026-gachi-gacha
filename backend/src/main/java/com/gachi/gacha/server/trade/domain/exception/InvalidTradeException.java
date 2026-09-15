package com.gachi.gacha.server.trade.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;

public class InvalidTradeException extends InvalidValueException {

    public InvalidTradeException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
