package com.gachi.gacha.server.member.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.application.OauthService;
import com.gachi.gacha.server.member.application.TokenService;
import com.gachi.gacha.server.member.application.dto.LoginInfo;
import com.gachi.gacha.server.member.application.dto.TokenInfo;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.InvalidOauthStateException;
import com.gachi.gacha.server.member.domain.exception.OauthAuthenticationDeniedException;
import com.gachi.gacha.server.member.presentation.dto.LoginResponse;
import com.gachi.gacha.server.member.presentation.session.OauthNonceSessionManager;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@Tag(name = "소셜 로그인", description = "카카오·네이버 OAuth 로그인")
@RestController
@RequestMapping("/oauth")
@RequiredArgsConstructor
public class OauthController {

    private final OauthService oauthService;
    private final TokenService tokenService;
    private final OauthNonceSessionManager oauthNonceSessionManager;

    @Operation(summary = "소셜 로그인 인가 페이지로 리다이렉트")
    @GetMapping("/{provider}")
    public ResponseEntity<Void> redirectAuthCodeRequestUrl(
            @Parameter(description = "소셜 로그인 제공자", example = "KAKAO")
            @PathVariable final OauthProviderType provider,
            final HttpSession session
    ) {
        String nonce = oauthNonceSessionManager.issue(session);
        String redirectUrl = oauthService.getAuthCodeRequestUrl(provider, nonce);

        return BaseResponse.redirect(URI.create(redirectUrl));
    }

    @Operation(summary = "소셜 로그인 콜백")
    @GetMapping("/login/{provider}")
    public BaseResponse<LoginResponse> login(
            @Parameter(description = "소셜 로그인 제공자", example = "KAKAO")
            @PathVariable final OauthProviderType provider,
            @Parameter(description = "제공자가 발급한 인가 코드")
            @RequestParam(required = false) final String code,
            @Parameter(description = "CSRF 방지용 state. 네이버 로그인에서 세션 nonce 와 대조한다.")
            @RequestParam(required = false) final String state,
            @Parameter(description = "인증 실패 시 제공자가 붙이는 오류 코드")
            @RequestParam(required = false) final String error,
            @Parameter(description = "인증 실패 사유 설명")
            @RequestParam(required = false) final String error_description,
            final HttpSession session
    ) {
        String nonce = oauthNonceSessionManager.consume(session);
        if (provider.equals(OauthProviderType.NAVER) && !nonce.equals(state)) {
            throw new InvalidOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
        }
        if (error != null) {
            log.warn("네이버 로그인 인증 실패: {} - {}", error, error_description);
            throw new OauthAuthenticationDeniedException(ErrorCode.OAUTH_AUTHENTICATION_DENIED);
        }
        LoginInfo info = oauthService.login(provider, code, nonce);
        TokenInfo tokens = tokenService.issue(info.memberId());
        return BaseResponse.ok(new LoginResponse(tokens.accessToken(), tokens.refreshToken()));
    }
}
