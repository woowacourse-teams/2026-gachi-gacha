package com.gachi.gacha.server.member.domain.exception;

import com.gachi.gacha.server.common.exception.EntityNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class MemberNotFoundException extends EntityNotFoundException {
    public MemberNotFoundException(ErrorCode errorCode) {
        super(errorCode);
    }
}
