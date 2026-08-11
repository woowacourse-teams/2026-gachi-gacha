package com.gachi.gacha.server.common.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.gachi.gacha.server.common.domain.BaseCode;
import java.net.URI;
import org.springframework.http.ResponseEntity;

public record BaseResponse<T>(
        String code,
        String message,
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        T data
) {
    public static <T> BaseResponse<T> ok(T data) {
        return of(BaseCode.SUCCESS, data);
    }

    public static <T> BaseResponse<T> ok() {
        return of(BaseCode.SUCCESS, null);
    }

    public static <T> ResponseEntity<BaseResponse<T>> created(URI location) {
        return created(location, null);
    }

    public static <T> ResponseEntity<BaseResponse<T>> created(URI location, T data) {
        return created(BaseCode.CREATED, location, data);
    }

    public static <T> ResponseEntity<BaseResponse<T>> created(String location) {
        return created(URI.create(location));
    }

    public static <T> ResponseEntity<BaseResponse<T>> created(String location, T data) {
        return created(URI.create(location), data);
    }

    public static <T> ResponseEntity<BaseResponse<T>> created(BaseCode baseCode, String location, T data) {
        return created(baseCode, URI.create(location), data);
    }

    public static <T> BaseResponse<T> of(BaseCode code, T data) {
        return new BaseResponse<>(code.getCode(), code.getMessage(), data);
    }

    public static <T> BaseResponse<T> of(BaseCode baseCode) {
        return of(baseCode, null);
    }

    private static <T> ResponseEntity<BaseResponse<T>> created(BaseCode baseCode, URI location, T data) {
        return ResponseEntity
                .created(location)
                .body(of(baseCode, data));
    }
}
