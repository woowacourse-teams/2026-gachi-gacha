package com.gachi.gacha.server.trade.domain.exception;

import com.gachi.gacha.server.common.exception.EntityNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class CategoryNotFoundException extends EntityNotFoundException {

    public CategoryNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
