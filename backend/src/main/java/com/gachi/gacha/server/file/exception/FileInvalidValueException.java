package com.gachi.gacha.server.file.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;

public class FileInvalidValueException extends InvalidValueException {
    public FileInvalidValueException(ErrorCode errorCode) {
        super(errorCode);
    }
}
