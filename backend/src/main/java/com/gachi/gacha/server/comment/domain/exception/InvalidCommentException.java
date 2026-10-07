package com.gachi.gacha.server.comment.domain.exception;

import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class InvalidCommentException extends BusinessException {

    public InvalidCommentException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
