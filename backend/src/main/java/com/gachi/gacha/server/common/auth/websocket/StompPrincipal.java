package com.gachi.gacha.server.common.auth.websocket;

import java.security.Principal;

public record StompPrincipal(
        Long memberId
) implements Principal {

    @Override
    public String getName() {
        return String.valueOf(memberId);
    }
}
