package com.gachi.gacha.server.member.domain.auth;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Embeddable
public class OauthId {

    private String oauthId;

    @Enumerated(EnumType.STRING)
    private OauthProviderType oauthProvider;
}
