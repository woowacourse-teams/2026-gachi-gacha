package com.gachi.gacha.server.store.domain.exception;

import com.gachi.gacha.server.common.exception.EntityNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;

public class StoreNotFoundException extends EntityNotFoundException {

    public StoreNotFoundException() {
        super(ErrorCode.STORE_NOT_FOUND);
    }
}
