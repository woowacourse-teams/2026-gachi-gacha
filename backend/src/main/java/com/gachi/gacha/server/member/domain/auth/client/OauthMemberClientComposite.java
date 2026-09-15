package com.gachi.gacha.server.member.domain.auth.client;

import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.UnSupportedServerTypeException;
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

    public Member fetch(final OauthProviderType oauthProviderType, final String authCode, String nonce) {
        return getClient(oauthProviderType).fetch(authCode, nonce);
    }

    private OauthMemberClient getClient(final OauthProviderType oauthServerType) {
        return Optional.ofNullable(mapping.get(oauthServerType))
                .orElseThrow(() -> new UnSupportedServerTypeException(ErrorCode.UNSUPPORTED_TYPE_ERROR));
    }
}
