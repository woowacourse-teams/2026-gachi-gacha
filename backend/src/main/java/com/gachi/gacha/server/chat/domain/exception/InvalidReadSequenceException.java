package com.gachi.gacha.server.chat.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;

public class InvalidReadSequenceException extends InvalidValueException {

    public InvalidReadSequenceException(ErrorCode errorCode) {
        super(errorCode);
    }
}
