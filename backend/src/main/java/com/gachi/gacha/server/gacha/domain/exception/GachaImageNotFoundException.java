package com.gachi.gacha.server.gacha.domain.exception;

import com.gachi.gacha.server.common.exception.EntityNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class GachaImageNotFoundException extends EntityNotFoundException {

    public GachaImageNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
