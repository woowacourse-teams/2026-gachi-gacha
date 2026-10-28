package com.gachi.gacha.server.member.presentation;

import static com.gachi.gacha.server.common.domain.dto.BaseResponse.redirect;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;
import com.gachi.gacha.server.member.application.OauthService;
import com.gachi.gacha.server.member.application.TokenService;
import com.gachi.gacha.server.member.application.dto.LoginInfo;
import com.gachi.gacha.server.member.application.dto.MobileNonceInfo;
import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.application.dto.TokenInfo;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.InvalidOauthStateException;
import com.gachi.gacha.server.member.domain.exception.OauthAuthenticationDeniedException;
import com.gachi.gacha.server.member.infra.apple.util.AppleUserNameExtractor;
import com.gachi.gacha.server.member.presentation.dto.LoginResponse;
import com.gachi.gacha.server.member.presentation.dto.MemberDeleteResponse;
import com.gachi.gacha.server.member.presentation.dto.MobileLoginRequest;
import com.gachi.gacha.server.member.presentation.dto.MobileNonceResponse;
import com.gachi.gacha.server.member.presentation.session.OauthNonceSessionManager;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Tag(name = "소셜 로그인", description = "카카오·네이버 OAuth 로그인")
@RestController
@RequestMapping("/oauth")
@RequiredArgsConstructor
public class OauthController {

    private static final String WITHDRAW_MEMBER_ID = "withdrawMemberId";

    private final OauthService oauthService;
    private final TokenService tokenService;
    private final OauthNonceSessionManager oauthNonceSessionManager;
    private final AppleUserNameExtractor appleUserNameExtractor;

    @Value("${oauth.frontend-callback-url}")
    private String frontendCallbackUrl;

    @Value("${oauth.frontend-withdraw-callback-url}")
    private String frontendWithdrawCallbackUrl;

    @Operation(summary = "소셜 로그인 인가 페이지로 리다이렉트")
    @GetMapping("/{provider}")
    public ResponseEntity<Void> redirectAuthCodeRequestUrl(
            @Parameter(description = "소셜 로그인 제공자", example = "KAKAO")
            @PathVariable final OauthProviderType provider,
            final HttpSession session
    ) {
        String nonce = oauthNonceSessionManager.issue(session);
        String redirectUrl = oauthService.getAuthCodeRequestUrl(provider, nonce);

        return redirect(URI.create(redirectUrl));
    }

    @Operation(summary = "Apple 회원 탈퇴용 재인증 URL 발급")
    @GetMapping("/withdraw-url")
    public BaseResponse<String> withdrawUrl(
            @Auth final Long memberId,
            final HttpSession session
    ) {
        String nonce = oauthNonceSessionManager.issue(session);
        session.setAttribute(WITHDRAW_MEMBER_ID, memberId);
        return BaseResponse.ok(oauthService.getWithdrawAuthCodeRequestUrl(memberId, nonce));
    }

    @Operation(summary = "회원 탈퇴 (애플)")
    @PostMapping("/withdraw/apple")
    public ResponseEntity<Void> appleWithdraw(
            @RequestParam(required = false) final String code,
            @RequestParam(required = false) final String state,
            @RequestParam(required = false) final String error,
            @RequestParam(name = "error_description", required = false) final String errorDescription,
            final HttpSession session
    ) {
        String nonce = oauthNonceSessionManager.consume(session);
        Long memberId = (Long) session.getAttribute(WITHDRAW_MEMBER_ID);
        session.removeAttribute(WITHDRAW_MEMBER_ID);
        try {
            if (error != null) {
                log.warn("Apple 탈퇴 재인증 실패: {} - {}", error, errorDescription);
                throw new OauthAuthenticationDeniedException(ErrorCode.OAUTH_AUTHENTICATION_DENIED);
            }
            if (memberId == null || nonce == null || code == null || !nonce.equals(state)) {
                throw new InvalidOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
            }
            oauthService.withdraw(memberId, code, nonce);
            return redirectToFrontend(frontendWithdrawCallbackUrl, "result=success");
        } catch (OauthAuthenticationDeniedException e) {
            return redirectToFrontend(frontendWithdrawCallbackUrl, "error=oauth_denied");
        } catch (InvalidOauthStateException e) {
            return redirectToFrontend(frontendWithdrawCallbackUrl, "error=invalid_state");
        } catch (RuntimeException e) {
            log.error("Apple 회원 탈퇴 처리 중 오류", e);
            return redirectToFrontend(frontendWithdrawCallbackUrl, "error=withdraw_failed");
        }
    }

    @Operation(summary = "회원 탈퇴 (카카오·네이버)")
    @DeleteMapping("/withdraw")
    public BaseResponse<MemberDeleteResponse> withdraw(
            @Auth final Long memberId
    ) {
        MemberDeleteResult result = oauthService.withdrawWithoutReauth(memberId);
        return BaseResponse.deleted(MemberDeleteResponse.from(result));
    }

    @Operation(summary = "소셜 로그인 콜백")
    @RequestMapping(value = "/login/{provider}", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Void> login(
            @Parameter(description = "소셜 로그인 제공자", example = "KAKAO")
            @PathVariable final OauthProviderType provider,
            @Parameter(description = "제공자가 발급한 인가 코드")
            @RequestParam(required = false) final String code,
            @Parameter(description = "CSRF 방지용 state. 네이버, 애플 로그인에서 세션 nonce 와 대조한다.")
            @RequestParam(required = false) final String state,
            @Parameter(description = "인증 실패 시 제공자가 붙이는 오류 코드")
            @RequestParam(required = false) final String error,
            @Parameter(description = "인증 실패 사유 설명")
            @RequestParam(required = false) final String error_description,
            @RequestParam(required = false) final String user,
            final HttpSession session
    ) {
        String nonce = oauthNonceSessionManager.consume(session);
        try {
            if (error != null) {
                log.warn("{} 로그인 인증 실패: {} - {}", provider, error, error_description);
                throw new OauthAuthenticationDeniedException(ErrorCode.OAUTH_AUTHENTICATION_DENIED);
            }
            if ((provider.equals(OauthProviderType.NAVER) || provider.equals(OauthProviderType.APPLE))
                    && (nonce == null || !nonce.equals(state))) {
                throw new InvalidOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
            }
            if (provider.equals(OauthProviderType.APPLE) && code == null) {
                throw new InvalidOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
            }

            String name = provider.equals(OauthProviderType.APPLE)
                    ? appleUserNameExtractor.extract(user) : null;
            LoginInfo info = oauthService.login(provider, code, nonce, name);
            TokenInfo tokens = tokenService.issue(info.memberId());

            return redirectToFrontend(
                    frontendCallbackUrl, "accessToken=" + tokens.accessToken() + "&refreshToken=" + tokens.refreshToken());
        } catch (OauthAuthenticationDeniedException e) {
            return redirectToFrontend(frontendCallbackUrl, "error=oauth_denied");
        } catch (InvalidOauthStateException e) {
            return redirectToFrontend(frontendCallbackUrl, "error=invalid_state");
        } catch (RuntimeException e) {
            log.error("{} 로그인 처리 중 오류", provider, e);
            return redirectToFrontend(frontendCallbackUrl, "error=login_failed");
        }
    }

    @Operation(summary = "모바일 로그인 nonce 발급")
    @GetMapping("/mobile/{provider}/nonce")
    public ResponseEntity<BaseResponse<MobileNonceResponse>> issueMobileNonce(
            @Parameter(description = "소셜 로그인 제공자", example = "KAKAO")
            @PathVariable final OauthProviderType provider
    ) {
        MobileNonceInfo info = oauthService.issueMobileNonce(provider);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(BaseResponse.ok(new MobileNonceResponse(info.nonce(), info.expiresInSeconds())));
    }

    @Operation(summary = "모바일 소셜 로그인 (인가 코드)")
    @PostMapping("/mobile/{provider}")
    public BaseResponse<LoginResponse> mobileLogin(
            @Parameter(description = "소셜 로그인 제공자", example = "KAKAO")
            @PathVariable final OauthProviderType provider,
            @Valid @RequestBody final MobileLoginRequest request
    ) {
        if ((provider.equals(OauthProviderType.KAKAO) || provider.equals(OauthProviderType.NAVER))
                && (request.codeVerifier() == null || request.codeVerifier().isBlank())) {
            throw new InvalidValueException(ErrorCode.INVALID_INPUT_VALUE);
        }
        oauthService.consumeMobileNonce(provider, request.nonce());
        String name = provider.equals(OauthProviderType.APPLE)
                ? appleUserNameExtractor.extract(request.user()) : null;
        LoginInfo info = oauthService.loginWithMobileCode(
                provider, request.code(), request.nonce(), request.codeVerifier(), name);
        TokenInfo tokens = tokenService.issue(info.memberId());
        return BaseResponse.ok(LoginResponse.from(tokens));
    }

    private ResponseEntity<Void> redirectToFrontend(final String callbackUrl, final String fragment) {
        URI target = UriComponentsBuilder.fromUriString(callbackUrl)
                .fragment(fragment)
                .build()
                .toUri();
        return ResponseEntity.status(HttpStatus.SEE_OTHER).location(target).build();
    }
}
