package com.gachi.gacha.server.member.domain.auth.vo;

import static java.util.Locale.ENGLISH;

public enum OauthProviderType {
    KAKAO,
    ;
    public static OauthProviderType fromName(String type) {
        return OauthProviderType.valueOf(type.toUpperCase(ENGLISH));
    }
}
