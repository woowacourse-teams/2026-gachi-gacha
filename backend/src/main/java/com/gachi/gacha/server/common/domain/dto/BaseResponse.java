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
    public static <T> BaseResponse<T> ok(final T data) {
        return of(BaseCode.SUCCESS, data);
    }

    public static <T> BaseResponse<T> ok() {
        return of(BaseCode.SUCCESS, null);
    }

    public static <T> ResponseEntity<BaseResponse<T>> created(final URI location, final T data) {
        return created(BaseCode.CREATED, location, data);
    }

    public static <T> BaseResponse<T> updated(final T data) {
        return of(BaseCode.UPDATED, data);
    }

    public static <T> BaseResponse<T> deleted(final T data) {
        return of(BaseCode.DELETED, data);
    }

    public static <T> BaseResponse<T> of(final BaseCode code, final T data) {
        return new BaseResponse<>(code.getCode(), code.getMessage(), data);
    }

    public static <T> BaseResponse<T> of(final BaseCode code) {
        return of(code, null);
    }

    private static <T> ResponseEntity<BaseResponse<T>> created(final BaseCode code, final URI location, final T data) {
        return ResponseEntity.created(location)
                .body(of(code, data));
    }
}
