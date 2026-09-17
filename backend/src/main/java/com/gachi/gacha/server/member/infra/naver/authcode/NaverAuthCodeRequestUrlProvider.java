package com.gachi.gacha.server.member.infra.naver.authcode;

import com.gachi.gacha.server.member.domain.auth.authcode.AuthCodeRequestUrlProvider;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.infra.naver.NaverOauthConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class NaverAuthCodeRequestUrlProvider implements AuthCodeRequestUrlProvider {

    private final NaverOauthConfig naverOauthConfig;

    @Override
    public OauthProviderType supportProvider() {
        return OauthProviderType.NAVER;
    }

    @Override
    public String provide(final String nonce) {
        return UriComponentsBuilder
                .fromUriString("https://nid.naver.com/oauth2/authorize")
                .queryParam("response_type", "code")
                .queryParam("client_id", naverOauthConfig.clientId())
                .queryParam("redirect_uri", naverOauthConfig.redirectUri())
                .queryParam("scope", String.join(" ", naverOauthConfig.scope()))
                .queryParam("state", nonce)
                .queryParam("nonce", nonce)
                .toUriString();
    }
}
