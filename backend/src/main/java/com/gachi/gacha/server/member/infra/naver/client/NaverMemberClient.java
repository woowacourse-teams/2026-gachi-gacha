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
import com.gachi.gacha.server.member.infra.naver.exception.UnAuthorizationNaverTokenException;
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

    @Override
    public Member fetchMobile(final String authCode, final String nonce,
                              final String codeVerifier, final String name) {
        NaverToken tokenInfo = fetchMobileToken(authCode, nonce, codeVerifier);
        validateNoError(tokenInfo);
        NaverIdTokenClaims claims = naverIdTokenValidator.validate(tokenInfo.idToken(), nonce);
        NaverProfileResponse profile = fetchProfile(tokenInfo.accessToken());
        return toMember(claims, profile);
    }

    private static Member toMember(final NaverIdTokenClaims claims, final NaverProfileResponse profile) {
        if (profile.response() == null || !claims.sub().equals(profile.response().id())) {
            throw new UnAuthorizationNaverTokenException(ErrorCode.UNAUTHORIZATION_TOKEN);
        }
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

    private NaverToken fetchMobileToken(final String authCode, final String nonce, final String codeVerifier) {
        try {
            if (naverOauthConfig.mobileRedirectUri() == null || naverOauthConfig.mobileRedirectUri().isBlank()) {
                throw new NaverTokenRequestFailedException(ErrorCode.NAVER_TOKEN_REQUEST_FAILED);
            }
            MultiValueMap<String, String> params = tokenRequestParams(
                    authCode, nonce, naverOauthConfig.mobileRedirectUri(), codeVerifier);
            if (naverOauthConfig.mobileClientId() != null && !naverOauthConfig.mobileClientId().isBlank()) {
                params.set("client_id", naverOauthConfig.mobileClientId());
            }
            if (naverOauthConfig.mobileClientSecret() != null && !naverOauthConfig.mobileClientSecret().isBlank()) {
                params.set("client_secret", naverOauthConfig.mobileClientSecret());
            }
            return naverApiClient.fetchToken(params);
        } catch (WebClientResponseException e) {
            throw new NaverApiCallFailedException(ErrorCode.NAVER_API_CALL_FAILED);
        }
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
        return tokenRequestParams(authCode, state, naverOauthConfig.redirectUri(), null);
    }

    private MultiValueMap<String, String> tokenRequestParams(final String authCode, final String state,
                                                              final String redirectUri,
                                                              final String codeVerifier) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", naverOauthConfig.clientId());
        params.add("redirect_uri", redirectUri);
        params.add("code", authCode);
        params.add("state", state);
        params.add("client_secret", naverOauthConfig.clientSecret());
        if (codeVerifier != null) {
            params.add("code_verifier", codeVerifier);
        }
        return params;
    }
}
