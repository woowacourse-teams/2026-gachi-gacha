package com.gachi.gacha.server.trade.domain.exception;

import com.gachi.gacha.server.common.exception.EntityNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class TradeImageNotFoundException extends EntityNotFoundException {

    public TradeImageNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
