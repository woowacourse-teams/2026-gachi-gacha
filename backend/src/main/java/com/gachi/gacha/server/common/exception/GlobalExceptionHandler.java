package com.gachi.gacha.server.common.exception;

import com.gachi.gacha.server.common.exception.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            final MethodArgumentNotValidException e,
            final HttpServletRequest request
    ) {
        String fieldErrors = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + "=" + fe.getRejectedValue() + "(" + fe.getDefaultMessage() + ")")
                .collect(Collectors.joining(", "));
        log.warn("[{} {}] Validation failed: {}", request.getMethod(), request.getRequestURI(), fieldErrors);

        ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE, e.getBindingResult());
        return ResponseEntity.status(ErrorCode.INVALID_INPUT_VALUE.getStatus()).body(response);
    }

    /**
     * JSON 형식이 깨졌거나 enum 에 없는 값처럼 본문을 객체로 바꿀 수 없는 요청이다. 클라이언트 입력 오류이므로 400 으로 응답한다.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    protected ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
            final HttpMessageNotReadableException e,
            final HttpServletRequest request
    ) {
        log.warn("[{} {}] Message not readable: {}", request.getMethod(), request.getRequestURI(),
                e.getMostSpecificCause().getMessage());
        ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE);
        return ResponseEntity.status(ErrorCode.INVALID_INPUT_VALUE.getStatus()).body(response);
    }

    @ExceptionHandler({MissingServletRequestPartException.class, MultipartException.class})
    protected ResponseEntity<ErrorResponse> handleMultipartException(
            final Exception e,
            final HttpServletRequest request
    ) {
        log.warn("[{} {}] Multipart error: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE);
        return ResponseEntity.status(ErrorCode.INVALID_INPUT_VALUE.getStatus()).body(response);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    protected ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupportedException(
            final HttpRequestMethodNotSupportedException e,
            final HttpServletRequest request
    ) {
        log.warn("[{} {}] Method not supported: supported={}", request.getMethod(), request.getRequestURI(),
                e.getSupportedHttpMethods());
        ErrorResponse response = ErrorResponse.of(ErrorCode.METHOD_NOT_ALLOWED);
        return ResponseEntity.status(ErrorCode.METHOD_NOT_ALLOWED.getStatus()).body(response);
    }

    @ExceptionHandler(BusinessException.class)
    protected ResponseEntity<ErrorResponse> handleBusinessException(
            final BusinessException e,
            final HttpServletRequest request
    ) {
        log.warn("handleBusinessException: {} - {}", e.getErrorCode(), e.getMessage());
        ErrorCode errorCode = e.getErrorCode();
        if (errorCode.getStatus().is5xxServerError()) {
            log.error("[{} {}] BusinessException: {} - {}", request.getMethod(), request.getRequestURI(),
                    errorCode, e.getMessage(), e);
        } else {
            log.warn("[{} {}] BusinessException: {} - {}", request.getMethod(), request.getRequestURI(),
                    errorCode, e.getMessage());
        }
        ErrorResponse response = ErrorResponse.of(errorCode);
        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }

    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> handleException(
            final Exception e,
            final HttpServletRequest request
    ) {
        log.error("[{} {}] Unhandled exception: {}", request.getMethod(), request.getRequestURI(),
                e.getMessage(), e);

        ErrorResponse response = ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR);
        return ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getStatus()).body(response);
    }
}
