package com.gachi.gacha.server.member.infra.naver.client;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.auth.client.OauthMemberClient;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;

import com.gachi.gacha.server.member.infra.naver.NaverOauthConfig;
import com.gachi.gacha.server.member.infra.naver.dto.NaverProfileResponse;
import com.gachi.gacha.server.member.infra.naver.dto.NaverToken;
import com.gachi.gacha.server.member.infra.naver.exception.NaverApiCallFailedException;
import com.gachi.gacha.server.member.infra.naver.exception.NaverTokenRequestFailedException;
import com.gachi.gacha.server.member.infra.naver.jwt.NaverIdTokenClaims;
import com.gachi.gacha.server.member.infra.naver.jwt.NaverIdTokenValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class NaverMemberClient implements OauthMemberClient {

    private static final String BEARER_PREFIX = "Bearer ";

    private final NaverApiClient naverApiClient;
    private final NaverOauthConfig naverOauthConfig;
    private final NaverIdTokenValidator naverIdTokenValidator;

    @Override
    public OauthProviderType supportProvider() {
        return OauthProviderType.NAVER;
    }

    @Override
    public Member fetch(final String authCode, final String state) {
        NaverToken tokenInfo = fetchToken(authCode, state);
        NaverIdTokenClaims claims = naverIdTokenValidator.validate(tokenInfo.idToken());
        NaverProfileResponse profile = fetchProfile(tokenInfo.accessToken());

        return toMember(claims, profile);
    }

    private static Member toMember(final NaverIdTokenClaims claims, final NaverProfileResponse profile) {
        return Member.builder()
                .oauthId(new OauthId(claims.sub(), OauthProviderType.NAVER))
                .nickname(profile.response().nickname())
                .profileImageUrl(profile.response().profileImage())
                .oauthUsername(profile.response().name())
                .build();
    }

    private NaverProfileResponse fetchProfile(final String accessToken) {
        try {
            return naverApiClient.fetchProfile(BEARER_PREFIX + accessToken);
        } catch (WebClientResponseException e) {
            log.error("네이버 프로필 조회 실패: {}", e.getResponseBodyAsString());
            throw new NaverApiCallFailedException(ErrorCode.NAVER_API_CALL_FAILED);
        }
    }

    private NaverToken fetchToken(final String authCode, final String state) {
        NaverToken tokenInfo = requestToken(authCode, state);
        validateNoError(tokenInfo);
        return tokenInfo;
    }

    private NaverToken requestToken(final String authCode, final String state) {
        try {
            return naverApiClient.fetchToken(tokenRequestParams(authCode, state));
        } catch (WebClientResponseException.Unauthorized e) {
            log.error("네이버 client 인증 실패, 설정을 확인하세요: {}", e.getResponseBodyAsString());
            throw new NaverApiCallFailedException(ErrorCode.NAVER_API_CALL_FAILED);
        } catch (WebClientResponseException e) {
            throw new NaverApiCallFailedException(ErrorCode.NAVER_API_CALL_FAILED);
        }
    }

    private static void validateNoError(final NaverToken tokenInfo) {
        if (tokenInfo.error() != null) {
            log.warn("네이버 토큰 발급 실패: {} - {}", tokenInfo.error(), tokenInfo.errorDescription());
            throw new NaverTokenRequestFailedException(ErrorCode.NAVER_TOKEN_REQUEST_FAILED);
        }
    }

    private MultiValueMap<String, String> tokenRequestParams(final String authCode, final String state) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", naverOauthConfig.clientId());
        params.add("redirect_uri", naverOauthConfig.redirectUri());
        params.add("code", authCode);
        params.add("state", state);
        params.add("client_secret", naverOauthConfig.clientSecret());
        return params;
    }
}
