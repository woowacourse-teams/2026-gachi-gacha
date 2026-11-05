package com.gachi.gacha.server.member.domain.auth.client;

import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;

public interface OauthMemberClient {
    OauthProviderType supportProvider();
    Member fetch(final String code, final String nonce);

    default Member fetch(final String code, final String nonce, final String name) {
        return fetch(code, nonce);
    }

    default Member fetchMobile(final String code, final String nonce,
                               final String codeVerifier, final String name) {
        throw new UnsupportedOperationException("Mobile authorization code login is not supported");
    }

    default void revokeByAuthCode(final String authCode, final String nonce, final String expectedOauthId) {
        throw new UnsupportedOperationException();
    }
}
