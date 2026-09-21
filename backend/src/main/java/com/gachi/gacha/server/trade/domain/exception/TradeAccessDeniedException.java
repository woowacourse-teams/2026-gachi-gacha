package com.gachi.gacha.server.trade.domain.exception;

import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class TradeAccessDeniedException extends BusinessException {

    public TradeAccessDeniedException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
