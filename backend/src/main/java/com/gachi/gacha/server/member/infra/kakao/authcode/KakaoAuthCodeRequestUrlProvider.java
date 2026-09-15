package com.gachi.gacha.server.member.infra.kakao.authcode;

import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.auth.authcode.AuthCodeRequestUrlProvider;
import com.gachi.gacha.server.member.infra.kakao.KakaoOauthConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class KakaoAuthCodeRequestUrlProvider implements AuthCodeRequestUrlProvider {

    private final KakaoOauthConfig kakaoOauthConfig;

    @Override
    public OauthProviderType supportProvider() {
        return OauthProviderType.KAKAO;
    }

    @Override
    public String provide(String nonce) {
        return UriComponentsBuilder
                .fromUriString("https://kauth.kakao.com/oauth/authorize")
                .queryParam("response_type", "code")
                .queryParam("client_id", kakaoOauthConfig.clientId())
                .queryParam("redirect_uri", kakaoOauthConfig.redirectUri())
                .queryParam("scope", String.join(",", kakaoOauthConfig.scope()))
                .queryParam("nonce", nonce)
                .toUriString();
    }
}
