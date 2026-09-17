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
    INVALID_PAGE_REQUEST(HttpStatus.BAD_REQUEST, "CE004", "유효하지 않은 페이지 요청입니다."),
    UNAUTHORIZATION_TOKEN(HttpStatus.UNAUTHORIZED, "CE005", "유효하지 않은 토큰입니다."),

    // Gacha
    GACHA_NOT_FOUND(HttpStatus.NOT_FOUND, "GE001", "존재하지 않는 가챠입니다."),
    INVALID_GACHA_POLICY(HttpStatus.BAD_REQUEST, "GE002", "유효하지 않은 가챠 정책입니다."),

    // Gacha Image
    GACHA_IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "GIE01", "존재하지 않는 가챠 사진입니다."),
    INVALID_GACHA_IMAGE_POLICY(HttpStatus.BAD_REQUEST, "GIE02", "유효하지 않은 가챠 사진입니다."),

    // Store
    STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "SE001", "존재하지 않는 매장입니다."),
    INVALID_STORE_POLICY(HttpStatus.BAD_REQUEST, "SE002", "유효하지 않은 매장 정보입니다."),
    INVALID_NEARBY_REQUEST(HttpStatus.BAD_REQUEST, "SE003", "유효하지 않은 주변 매장 조회 요청입니다."),

    // Store Image
    STORE_IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "SIE01", "존재하지 않는 매장 사진입니다."),
    INVALID_STORE_IMAGE_POLICY(HttpStatus.BAD_REQUEST, "SIE02", "유효하지 않은 매장 사진입니다."),

    // S3
    S3_IMAGE_INVALID_POLICY(HttpStatus.BAD_REQUEST, "S3E01", "지원하지 않는 이미지 형식입니다."),
    S3_IMAGE_READ_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E02", "이미지 파일을 읽는 중 오류가 발생했습니다."),
    S3_IMAGE_DOWNLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E03", "원본 이미지를 다운로드하는 중 오류가 발생했습니다."),
    S3_FILE_INVALID_POLICY(HttpStatus.BAD_REQUEST, "S3E04", "지원하지 않는 파일 형식입니다."),
    S3_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E05", "파일 업로드 중 오류가 발생했습니다."),
    S3_DELETE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E06", "파일 삭제 중 오류가 발생했습니다."),
    S3_MOVE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E07", "파일을 휴지통으로 이동하는 중 오류가 발생했습니다."),
    S3_READ_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E08", "파일을 읽는 중 오류가 발생했습니다."),
    S3_FILE_COUNT_EXCEEDED(HttpStatus.BAD_REQUEST, "S3E09", "한 번에 업로드할 수 있는 파일 개수를 초과했습니다."),

    // Member
    UNSUPPORTED_TYPE_ERROR(HttpStatus.BAD_REQUEST, "AUE01", "지원하지 않는 소셜 로그인 타입입니다."),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "AUE02", "존재하지 않는 사용자입니다."),
    INVALID_OAUTH_STATE(HttpStatus.BAD_REQUEST, "AUE03", "로그인 요청이 유효하지 않습니다. 다시 로그인해주세요."),
    OAUTH_AUTHENTICATION_DENIED(HttpStatus.UNAUTHORIZED, "AUE04", "로그인이 취소되었거나 실패했습니다. 다시 시도해주세요."),

    // Category
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "CAE01", "존재하지 않는 카테고리입니다."),

    // Trade
    TRADE_NOT_FOUND(HttpStatus.NOT_FOUND, "TE001", "존재하지 않는 교환 게시글입니다."),
    INVALID_TRADE_POLICY(HttpStatus.BAD_REQUEST, "TE002", "유효하지 않은 교환 게시글 정보입니다."),
    TRADE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "TE003", "본인이 작성한 교환 게시글만 수정하거나 삭제할 수 있습니다."),

    // Trade Image
    TRADE_IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "TIE01", "존재하지 않는 교환 게시글 사진입니다."),
    INVALID_TRADE_IMAGE_POLICY(HttpStatus.BAD_REQUEST, "TIE02", "유효하지 않은 교환 게시글 사진입니다."),

    //kakao
    KAKAO_TOKEN_REQUEST_FAILED(HttpStatus.UNAUTHORIZED, "KE01", "카카오 인증에 실패했습니다. 다시 로그인해주세요."),
    KAKAO_API_CALL_FAILED(HttpStatus.BAD_GATEWAY, "KE02", "카카오 서버와 통신 중 오류가 발생했습니다."),

    //naver
    NAVER_TOKEN_REQUEST_FAILED(HttpStatus.UNAUTHORIZED, "NE01", "네이버 인증에 실패했습니다. 다시 로그인해주세요."),
    NAVER_API_CALL_FAILED(HttpStatus.BAD_GATEWAY, "NE02", "네이버 서버와 통신 중 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
