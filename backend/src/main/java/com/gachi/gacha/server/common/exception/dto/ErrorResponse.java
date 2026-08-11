package com.gachi.gacha.server.common.exception.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.gachi.gacha.server.common.exception.ErrorCode;
import java.util.List;
import org.springframework.validation.BindingResult;

public record ErrorResponse(
        String code,
        String message,
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        List<FieldErrorDetail> errors
) {

    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), List.of());
    }

    public static ErrorResponse of(ErrorCode errorCode, BindingResult bindingResult) {
        return new ErrorResponse(
                errorCode.getCode(),
                errorCode.getMessage(),
                FieldErrorDetail.from(bindingResult)
        );
    }

    public record FieldErrorDetail(
            String field,
            String value,
            String reason
    ) {
        public static List<FieldErrorDetail> from(BindingResult bindingResult) {
            return bindingResult.getFieldErrors().stream()
                    .map(error -> new FieldErrorDetail(
                            error.getField(),
                            error.getRejectedValue() == null ? "" : error.getRejectedValue().toString(),
                            error.getDefaultMessage()
                    ))
                    .toList();
        }
    }
}
