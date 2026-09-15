package com.gachi.gacha.server.trade.domain.exception;

import com.gachi.gacha.server.common.exception.EntityNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class TradeNotFoundException extends EntityNotFoundException {

    public TradeNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
