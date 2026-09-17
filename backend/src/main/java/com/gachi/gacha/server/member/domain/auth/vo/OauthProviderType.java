package com.gachi.gacha.server.member.domain.auth.vo;

import static java.util.Locale.ENGLISH;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.exception.UnSupportedProviderTypeException;

public enum OauthProviderType {
    KAKAO,
    NAVER
    ;
    public static OauthProviderType fromName(String type) {
        try {
            return OauthProviderType.valueOf(type.toUpperCase(ENGLISH));
        } catch (IllegalArgumentException e) {
            throw new UnSupportedProviderTypeException(ErrorCode.UNSUPPORTED_TYPE_ERROR);
        }
    }
}
