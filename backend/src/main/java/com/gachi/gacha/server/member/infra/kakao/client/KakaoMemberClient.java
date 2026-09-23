package com.gachi.gacha.server.member.infra.kakao.client;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.auth.client.OauthMemberClient;
import com.gachi.gacha.server.member.infra.kakao.KakaoOauthConfig;
import com.gachi.gacha.server.member.infra.kakao.dto.KakaoToken;
import com.gachi.gacha.server.member.infra.kakao.exception.KakaoApiCallFailedException;
import com.gachi.gacha.server.member.infra.kakao.exception.KakaoTokenRequestFailedException;
import com.gachi.gacha.server.member.infra.kakao.jwt.KakaoIdTokenClaims;
import com.gachi.gacha.server.member.infra.kakao.jwt.KakaoIdTokenValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoMemberClient implements OauthMemberClient {

    private final KakaoApiClient kakaoApiClient;
    private final KakaoOauthConfig kakaoOauthConfig;
    private final KakaoIdTokenValidator kakaoIdTokenValidator;

    @Override
    public OauthProviderType supportProvider() {
        return OauthProviderType.KAKAO;
    }

    @Override
    public Member fetch(final String authCode, final String nonce) {
        KakaoToken tokenInfo = fetchToken(authCode);
        KakaoIdTokenClaims claims = kakaoIdTokenValidator.validate(tokenInfo.idToken(), nonce);
        return toMember(claims);
    }

    private static Member toMember(final KakaoIdTokenClaims claims) {
        return Member.builder()
                .oauthId(new OauthId(claims.sub(), OauthProviderType.KAKAO))
                .nickname(claims.nickname())
                .profileImageUrl(claims.profileImageUrl())
                .oauthUsername(claims.nickname())
                .build();
    }

    private KakaoToken fetchToken(final String authCode) {
        try {
            return kakaoApiClient.fetchToken(tokenRequestParams(authCode));
        } catch (WebClientResponseException.BadRequest e) {
            throw new KakaoTokenRequestFailedException(ErrorCode.KAKAO_TOKEN_REQUEST_FAILED);
        } catch (WebClientResponseException.Unauthorized e) {
            log.error("카카오 client 인증 실패, 설정을 확인하세요: {}", e.getResponseBodyAsString());
            throw new KakaoApiCallFailedException(ErrorCode.KAKAO_API_CALL_FAILED);
        } catch (WebClientResponseException e) {
            throw new KakaoApiCallFailedException(ErrorCode.KAKAO_API_CALL_FAILED);
        }
    }

    private MultiValueMap<String, String> tokenRequestParams(final String authCode) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", kakaoOauthConfig.clientId());
        params.add("redirect_uri", kakaoOauthConfig.redirectUri());
        params.add("code", authCode);
        params.add("client_secret", kakaoOauthConfig.clientSecret());
        return params;
    }
}
