package com.gachi.gacha.server.common.exception;

public class S3Exception extends RuntimeException {

    public S3Exception(final String message) {
        super(message);
    }

    public S3Exception(final String message, final Throwable cause) {
        super(message, cause);
    }
}
