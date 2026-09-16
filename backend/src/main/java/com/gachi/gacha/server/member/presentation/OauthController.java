package com.gachi.gacha.server.member.presentation;

import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.application.OauthService;
import com.gachi.gacha.server.member.application.dto.LoginInfo;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.InvalidOauthStateException;
import com.gachi.gacha.server.member.domain.exception.OauthAuthenticationDeniedException;
import com.gachi.gacha.server.member.presentation.dto.LoginResponse;
import com.gachi.gacha.server.member.presentation.session.OauthNonceSessionManager;
import jakarta.servlet.http.HttpSession;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/oauth")
@RequiredArgsConstructor
public class OauthController {

    private final OauthService oauthService;
    private final JwtProvider jwtProvider;
    private final OauthNonceSessionManager oauthNonceSessionManager;

    @GetMapping("/{provider}")
    @SneakyThrows
    public ResponseEntity<Void> redirectAuthCodeRequestUrl(
            @PathVariable OauthProviderType provider,
            HttpSession session
    ) {
        String nonce = oauthNonceSessionManager.issue(session);
        String redirectUrl = oauthService.getAuthCodeRequestUrl(provider, nonce);

        return BaseResponse.redirect(URI.create(redirectUrl));
    }

    @GetMapping("/login/{provider}")
    public BaseResponse<LoginResponse> login(
            @PathVariable OauthProviderType provider,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String error_description,
            HttpSession session
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
        String token = jwtProvider.createToken(info.memberId());
        return BaseResponse.ok(new LoginResponse(token));
    }
}
