package com.gachi.gacha.server.common.domain;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum BaseCode {

    SUCCESS(HttpStatus.OK, "C000", "정상"),
    CREATED(HttpStatus.CREATED, "C001", "정상 생성"),
    UPDATED(HttpStatus.NO_CONTENT, "C002", "정상 수정"),
    DELETED(HttpStatus.NO_CONTENT, "C003", "정상 삭제");

    private final HttpStatus status;
    private final String code;
    private final String message;

    BaseCode(String message) {
        this.status = HttpStatus.OK;
        this.code = "C000";
        this.message = message;
    }

    BaseCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
