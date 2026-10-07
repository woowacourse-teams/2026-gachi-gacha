package com.gachi.gacha.server.common.web;

import jakarta.servlet.http.HttpServletRequest;
import lombok.NonNull;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * {@code X-Forwarded-For} 를 직접 파싱하지 않는다. application.yaml 의
 * {@code server.forward-headers-strategy: framework} 가 ForwardedHeaderFilter 를 통해
 * {@code getRemoteAddr()} 을 이미 실제 클라이언트 IP 로 보정해 준다.
 */
@Component
public class ClientIpArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(final MethodParameter parameter) {
        return parameter.hasParameterAnnotation(ClientIp.class)
                && parameter.getParameterType().equals(String.class);
    }

    @Override
    public Object resolveArgument(@NonNull final MethodParameter parameter,
                                  final ModelAndViewContainer mavContainer,
                                  @NonNull final NativeWebRequest webRequest,
                                  final WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) {
            return ClientIpMasker.mask(null);
        }
        return ClientIpMasker.mask(request.getRemoteAddr());
    }
}
