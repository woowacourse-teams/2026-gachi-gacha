package com.gachi.gacha.server.notification.domain.exception;

import com.gachi.gacha.server.common.exception.EntityNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class NotificationNotFoundException extends EntityNotFoundException {
    public NotificationNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
