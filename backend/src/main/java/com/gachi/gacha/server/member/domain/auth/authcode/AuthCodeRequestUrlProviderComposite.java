package com.gachi.gacha.server.member.domain.auth.authcode;

import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.UnSupportedServerTypeException;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AuthCodeRequestUrlProviderComposite {

    private final Map<OauthProviderType, AuthCodeRequestUrlProvider> mapping;

    public AuthCodeRequestUrlProviderComposite(final Set<AuthCodeRequestUrlProvider> providers) {
        mapping = providers.stream()
                .collect(toMap(
                        AuthCodeRequestUrlProvider::supportProvider,
                        identity()
                ));
    }

    public String provide(final OauthProviderType provider, String nonce) {
        return getProvider(provider).provide(nonce);
    }

    private AuthCodeRequestUrlProvider getProvider(final OauthProviderType providerType) {
        return Optional.ofNullable(mapping.get(providerType))
                .orElseThrow(() -> new UnSupportedServerTypeException(ErrorCode.UNSUPPORTED_TYPE_ERROR));
    }
}
