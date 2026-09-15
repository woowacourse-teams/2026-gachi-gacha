package com.gachi.gacha.server.member.domain.auth.authcode;

import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;

public interface AuthCodeRequestUrlProvider {
    OauthProviderType supportProvider();
    String provide(String nonce);
}
