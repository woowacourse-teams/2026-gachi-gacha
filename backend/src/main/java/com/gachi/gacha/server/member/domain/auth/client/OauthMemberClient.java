package com.gachi.gacha.server.member.domain.auth.client;

import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;

public interface OauthMemberClient {
    OauthProviderType supportProvider();
    Member fetch(final String code, final String nonce);
}
