package com.gachi.gacha.server.store.infra.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.ExternalApiException;

public class S3Exception extends ExternalApiException {
    public S3Exception(ErrorCode errorCode) {
        super(errorCode);
    }
}
