package com.gachi.gacha.server.collection.application.exception;

import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class GachaCollectionException extends BusinessException {
    public GachaCollectionException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
