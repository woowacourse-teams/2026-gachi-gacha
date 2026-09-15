package com.gachi.gacha.server.member.presentation;

import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.member.application.OauthService;
import com.gachi.gacha.server.member.application.dto.LoginInfo;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.presentation.dto.LoginResponse;
import com.gachi.gacha.server.member.presentation.session.OauthNonceSessionManager;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/oauth")
@RequiredArgsConstructor
public class OauthController {

    private final OauthService oauthService;
    private final JwtProvider jwtProvider;
    private final OauthNonceSessionManager oauthNonceSessionManager;

    @GetMapping("/{provider}")
    @SneakyThrows
    public BaseResponse<Void> redirectAuthCodeRequestUrl(
            @PathVariable OauthProviderType provider,
            HttpServletResponse response,
            HttpSession session
    ) {
        String nonce = oauthNonceSessionManager.issue(session);
        String redirectUrl = oauthService.getAuthCodeRequestUrl(provider, nonce);
        response.sendRedirect(redirectUrl);
        return BaseResponse.ok();
    }

    @GetMapping("/login/{provider}")
    public BaseResponse<LoginResponse> login(
            @PathVariable OauthProviderType provider,
            @RequestParam String code,
            HttpSession session
    ) {
        String nonce = oauthNonceSessionManager.consume(session);
        LoginInfo info = oauthService.login(provider, code, nonce);
        String token = jwtProvider.createToken(info.memberId());
        return BaseResponse.ok(new LoginResponse(token));
    }
}
