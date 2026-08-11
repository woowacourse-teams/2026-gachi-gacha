package com.gachi.gacha.server.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "CE001", "유효하지 않은 입력값입니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "CE002", "지원하지 않는 HTTP 메서드입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "CE003", "서버 내부 오류가 발생했습니다."),

    // Gacha
    GACHA_NOT_FOUND(HttpStatus.NOT_FOUND, "GE001", "존재하지 않는 가챠입니다."),
    INVALID_GACHA_POLICY(HttpStatus.BAD_REQUEST, "GE002", "유효하지 않은 가챠 정책입니다."),

    // Store
    STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "S001", "존재하지 않는 매장입니다."),
    INVALID_STORE_POLICY(HttpStatus.BAD_REQUEST, "S002", "유효하지 않은 매장 정보입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
