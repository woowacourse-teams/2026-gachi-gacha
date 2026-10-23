package com.gachi.gacha.server.member.infra.apple.client;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.auth.client.OauthMemberClient;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.util.NicknameGenerator;
import com.gachi.gacha.server.member.infra.apple.AppleOauthConfig;
import com.gachi.gacha.server.member.infra.apple.dto.AppleToken;
import com.gachi.gacha.server.member.infra.apple.exception.AppleApiCallFailedException;
import com.gachi.gacha.server.member.infra.apple.exception.AppleTokenRequestFailedException;
import com.gachi.gacha.server.member.infra.apple.exception.InvalidAppleOauthStateException;
import com.gachi.gacha.server.member.infra.apple.generator.AppleClientSecretGenerator;
import com.gachi.gacha.server.member.infra.apple.jwt.AppleIdTokenClaims;
import com.gachi.gacha.server.member.infra.apple.jwt.AppleIdTokenValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppleMemberClient implements OauthMemberClient {

    private static final int MAX_NICKNAME_LENGTH = 20;

    private final AppleApiClient appleApiClient;
    private final AppleOauthConfig config;
    private final AppleClientSecretGenerator secretGenerator;
    private final AppleIdTokenValidator validator;

    @Override
    public OauthProviderType supportProvider() {
        return OauthProviderType.APPLE;
    }

    @Override
    public Member fetch(String authCode, String nonce) {
        return fetch(authCode, nonce, null);
    }

    @Override
    public Member fetch(final String authCode, final String nonce, final String name) {
        AppleToken token = fetchToken(authCode, config.redirectUri());
        AppleIdTokenClaims claims = validator.validate(token.idToken(), nonce);
        return Member.builder()
                .oauthId(new OauthId(claims.sub(), OauthProviderType.APPLE))
                .nickname(resolveNickname(name))
                .oauthUsername(claims.email())
                .build();
    }

    @Override
    public void revokeByAuthCode(final String authCode, final String nonce, final String expectedOauthId) {
        AppleToken token = fetchToken(authCode, config.withdrawRedirectUri());
        AppleIdTokenClaims claims = validator.validate(token.idToken(), nonce);
        if (!claims.sub().equals(expectedOauthId)) {
            throw new InvalidAppleOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
        }
        revoke(token.refreshToken());
    }

    private void revoke(final String refreshToken) {
        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("client_id", config.clientId());
            params.add("client_secret", secretGenerator.generate());
            params.add("token", refreshToken);
            params.add("token_type_hint", "refresh_token");
            appleApiClient.revoke(params);
        } catch (WebClientResponseException e) {
            log.error("Apple revoke 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AppleApiCallFailedException(ErrorCode.APPLE_API_CALL_FAILED);
        }
    }

    private static String resolveNickname(final String name) {
        if (name == null) {
            return NicknameGenerator.random();
        }
        String cleaned = name.replaceAll("\\p{Cntrl}", "").strip();
        if (cleaned.isEmpty()) {
            return NicknameGenerator.random();
        }
        int end = cleaned.offsetByCodePoints(0, Math.min(MAX_NICKNAME_LENGTH, cleaned.codePointCount(0, cleaned.length())));
        return cleaned.substring(0, end);
    }

    private AppleToken fetchToken(final String authCode, String redirectUri) {
        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "authorization_code");
            params.add("client_id", config.clientId());
            params.add("client_secret", secretGenerator.generate());
            params.add("redirect_uri", redirectUri);
            params.add("code", authCode);
            return appleApiClient.fetchToken(params);
        } catch (WebClientResponseException.BadRequest e) {
            log.warn("Apple token 교환 거부: {}", e.getResponseBodyAsString());
            throw new AppleTokenRequestFailedException(ErrorCode.APPLE_TOKEN_REQUEST_FAILED);
        } catch (WebClientResponseException e) {
            throw new AppleApiCallFailedException(ErrorCode.APPLE_API_CALL_FAILED);
        }
    }
}
