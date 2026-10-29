package com.gachi.gacha.server.member.domain.auth.client;

import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.UnSupportedProviderTypeException;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class OauthMemberClientComposite {

    private final Map<OauthProviderType, OauthMemberClient> mapping;

    public OauthMemberClientComposite(final Set<OauthMemberClient> clients) {
        mapping = clients.stream()
                .collect(toMap(
                        OauthMemberClient::supportProvider,
                        identity()
                ));
    }

    public void revokeByAuthCode(final OauthProviderType type, final String authCode,
                                 final String nonce, final String expectedOauthId) {
        getClient(type).revokeByAuthCode(authCode, nonce, expectedOauthId);
    }

    public Member fetch(final OauthProviderType oauthProviderType, final String authCode,
                        final String nonce, final String name) {
        return getClient(oauthProviderType).fetch(authCode, nonce, name);
    }

    private OauthMemberClient getClient(final OauthProviderType oauthProviderType) {
        return Optional.ofNullable(mapping.get(oauthProviderType))
                .orElseThrow(() -> new UnSupportedProviderTypeException(ErrorCode.UNSUPPORTED_TYPE_ERROR));
    }
}
