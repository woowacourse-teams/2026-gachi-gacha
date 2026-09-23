package com.gachi.gacha.server.common.infra.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DomainType {
    STORE("매장", "store"),
    GACHA("가챠", "gacha"),
    TRADE("교환 게시글", "trade"),
    CHAT("채팅", "chat");

    private final String label;
    private final String folderName;

    public String buildPath(final String s3RootFolder) {
        return "%s/%s".formatted(s3RootFolder, folderName);
    }
}
