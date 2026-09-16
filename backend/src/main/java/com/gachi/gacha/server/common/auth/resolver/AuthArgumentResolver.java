package com.gachi.gacha.server.common.auth.resolver;

import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
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
        Auth auth = parameter.getParameterAnnotation(Auth.class);
        boolean isRequired = (auth == null) || auth.required();

        String accessToken = extractAccessToken(webRequest, isRequired);

        if (!StringUtils.hasText(accessToken)) {
            return null;
        }

        return jwtProvider.extractMemberId(accessToken);
    }

    private String extractAccessToken(final NativeWebRequest webRequest, boolean isRequired) {
        String bearerToken = webRequest.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        if (isRequired) {
            throw new UnAuthorizationException(ErrorCode.UNAUTHORIZATION_TOKEN);
        }
        return null;
    }
}
