package com.gachi.gacha.server.common.auth.resolver;

import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
@RequiredArgsConstructor
public class AuthArgumentResolver implements HandlerMethodArgumentResolver {

    private final JwtProvider jwtProvider;

    @Override
    public boolean supportsParameter(final MethodParameter parameter) {
        boolean hasAuth = parameter.hasParameterAnnotation(Auth.class);
        boolean authType = parameter.getParameterType().equals(Long.class);
        return hasAuth && authType;
    }

    @Override
    public Object resolveArgument(@NonNull final MethodParameter parameter, final ModelAndViewContainer mavContainer,
                                  @NonNull final NativeWebRequest webRequest, final WebDataBinderFactory binderFactory)
    {
        String accessToken = extractAccessToken(webRequest);
        return jwtProvider.extractMemberId(accessToken);
    }

    private String extractAccessToken(final NativeWebRequest webRequest) {
        String bearerToken = webRequest.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new UnAuthorizationException(ErrorCode.UNAUTHORIZATION_TOKEN);
    }
}
