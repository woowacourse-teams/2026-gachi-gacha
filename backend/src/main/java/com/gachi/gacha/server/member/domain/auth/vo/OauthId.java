package com.gachi.gacha.server.member.domain.auth.vo;

import static lombok.AccessLevel.PROTECTED;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Embeddable
@AllArgsConstructor
@NoArgsConstructor(access = PROTECTED)
public class OauthId {

    private String oauthId;

    @Enumerated(EnumType.STRING)
    private OauthProviderType oauthProvider;
}
